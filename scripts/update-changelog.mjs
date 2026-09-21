import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_PATH = path.resolve(SCRIPT_DIR, '../src/data/generatedUpdates.json');

export function bumpVersion(version, bump = 'patch') {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) throw new Error(`Invalid version: ${version}`);
  const [major, minor, patchVersion] = parts;
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patchVersion + 1}`;
}

function clean(value) {
  return value.replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim();
}

function completedStatement(value) {
  const text = clean(value).replace(/[。.]$/, '');
  return /ました$/.test(text) ? `${text}。` : `「${text}」を反映しました。`;
}

function extractSection(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return body.match(new RegExp(`^##\\s+${escaped}\\s*\\r?\\n([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`, 'mi'))?.[1]?.trim() ?? '';
}

function parseUpdateTable(section) {
  return section.split('\n').flatMap((line) => {
    const cells = line.split('|').map(clean).filter(Boolean);
    if (cells.length < 2 || cells.every((cell) => /^[-:]+$/.test(cell)) || cells[0] === '対象') return [];
    if (cells[0] === '機能名' || cells.slice(1).join('').includes('〇〇')) return [];
    return [{ target: cells[0], change: completedStatement(cells.slice(1).join(' / ')) }];
  });
}

function parseChangeBullets(body) {
  const section = extractSection(body, '変更内容');
  if (!section) return [];
  let target = 'アプリ';
  const items = [];
  for (const rawLine of section.split('\n')) {
    const heading = rawLine.match(/^###\s+(.+)$/);
    if (heading) { target = clean(heading[1]); continue; }
    const bullet = rawLine.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) items.push({ target, change: completedStatement(bullet[1]) });
  }
  return items.slice(0, 20);
}

function directive(body, key) {
  return body.match(new RegExp(`<!--\\s*update:${key}=([\\s\\S]*?)\\s*-->`, 'i'))?.[1]?.trim() || undefined;
}

function japanDate(isoDate) {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(isoDate));
  const get = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}.${get('month')}.${get('day')}`;
}

export function createUpdateFromPullRequest(pullRequest, currentVersion) {
  const body = pullRequest.body ?? '';
  const labels = (pullRequest.labels ?? []).map((label) => typeof label === 'string' ? label : label.name);
  const bump = directive(body, 'bump')
    ?? (labels.includes('version:major') ? 'major' : labels.includes('version:minor') ? 'minor' : 'patch');
  const version = bumpVersion(currentVersion, ['major', 'minor', 'patch'].includes(bump) ? bump : 'patch');
  const title = directive(body, 'title') ?? clean(pullRequest.title).replace(/^(feat|fix|chore|refactor|perf|docs|test):\s*/i, '');
  const summary = directive(body, 'summary') ?? `PR #${pullRequest.number}「${title}」の内容を反映しました。`;
  const updateSection = extractSection(body, 'アプデ');
  const tableItems = parseUpdateTable(updateSection);
  const items = tableItems.length > 0
    ? tableItems
    : parseChangeBullets(body);

  return {
    version,
    date: japanDate(pullRequest.merged_at ?? new Date().toISOString()),
    title,
    summary: completedStatement(summary),
    items: items.length > 0 ? items : [{ target: 'アプリ', change: completedStatement(title) }],
  };
}

export function updateChangelog(event, data) {
  const pullRequest = event.pull_request;
  if (!pullRequest?.merged) return { changed: false, reason: 'not-merged', data };
  const processedPrs = data.processedPrs ?? [data.lastProcessedPr].filter(Boolean);
  if (processedPrs.includes(pullRequest.number)) return { changed: false, reason: 'already-processed', data };
  const labels = (pullRequest.labels ?? []).map((label) => typeof label === 'string' ? label : label.name);
  if (labels.includes('skip-update-log')) {
    return { changed: true, reason: 'skipped', data: { ...data, lastProcessedPr: Math.max(data.lastProcessedPr ?? 0, pullRequest.number), processedPrs: [...processedPrs, pullRequest.number] } };
  }
  const update = createUpdateFromPullRequest(pullRequest, data.currentVersion);
  return {
    changed: true,
    reason: 'added',
    data: {
      currentVersion: update.version,
      lastProcessedPr: Math.max(data.lastProcessedPr ?? 0, pullRequest.number),
      processedPrs: [...processedPrs, pullRequest.number],
      updates: [update, ...data.updates],
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const eventPath = process.argv[2] ?? process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('GitHub event path is required.');
  const dataPath = process.env.UPDATE_DATA_PATH ?? DEFAULT_DATA_PATH;
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const result = updateChangelog(event, data);
  if (result.changed) fs.writeFileSync(dataPath, `${JSON.stringify(result.data, null, 2)}\n`);
  console.log(JSON.stringify({ changed: result.changed, reason: result.reason, version: result.data.currentVersion }));
}
