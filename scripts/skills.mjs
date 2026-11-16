#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalRoot = '.agents/skills';
const claudeRoot = '.claude/skills';
const skillName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function statIfPresent(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

// Lock paths are portable, repository-relative paths, never symbolic links.
function projectPath(root, relative, allowMissing = false) {
  requireCondition(
    typeof relative === 'string' && relative.length > 0 &&
      !relative.includes('\\') && !relative.includes('\0') &&
      !posix.isAbsolute(relative) && !/^[A-Za-z]:/.test(relative) &&
      posix.normalize(relative) === relative &&
      relative.split('/').every((part) => part !== '.' && part !== '..'),
    `Unsafe relative path: ${relative}`,
  );
  const parts = relative.split('/');
  let path = root;
  for (let index = 0; index < parts.length; index += 1) {
    path = join(path, parts[index]);
    const stat = statIfPresent(path);
    if (!stat) {
      requireCondition(allowMissing, `Missing path: ${relative}`);
      return join(root, ...parts);
    }
    requireCondition(!stat.isSymbolicLink(), `Symbolic links are not allowed: ${relative}`);
    if (index < parts.length - 1) {
      requireCondition(stat.isDirectory(), `Expected directory: ${path}`);
    }
  }
  return path;
}

function inventory(directory) {
  const result = [];
  function visit(path, prefix = '') {
    for (const name of readdirSync(path).sort()) {
      const child = join(path, name);
      const relative = prefix ? `${prefix}/${name}` : name;
      const stat = lstatSync(child);
      requireCondition(!stat.isSymbolicLink(), `Symbolic links are not allowed: ${child}`);
      if (stat.isDirectory()) visit(child, relative);
      else {
        requireCondition(stat.isFile(), `Expected regular file: ${child}`);
        result.push(relative);
      }
    }
  }
  visit(directory);
  return result.sort();
}

function readFile(path) {
  const stat = lstatSync(path);
  requireCondition(stat.isFile() && !stat.isSymbolicLink(), `Expected regular file: ${path}`);
  return readFileSync(path, 'utf8');
}

// Only the two discovery fields are parsed; this is not a general YAML parser.
function discoveryField(frontmatter, key, label) {
  const lines = frontmatter.split(/\r?\n/);
  const indices = lines.flatMap((line, index) => line.startsWith(`${key}:`) ? [index] : []);
  requireCondition(indices.length === 1, `${label}: expected one ${key} field`);
  const index = indices[0];
  let value = lines[index].slice(key.length + 1).trim();
  if (/^[>|][+-]?$/.test(value)) {
    const block = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (lines[cursor].trim() && !/^\s/.test(lines[cursor])) break;
      block.push(lines[cursor].trim());
    }
    value = block.join(value[0] === '>' ? ' ' : '\n').trim();
  } else if (value.startsWith('"')) {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error(`${label}: unsupported quoted ${key}; use a JSON-compatible YAML string`);
    }
  } else if (value.startsWith("'")) {
    requireCondition(value.endsWith("'"), `${label}: unterminated ${key}`);
    value = value.slice(1, -1).replaceAll("''", "'");
  } else {
    requireCondition(!/^(?:[[{]|null$|~$)/.test(value), `${label}: ${key} must be a string`);
  }
  requireCondition(typeof value === 'string' && value.trim(), `${label}: empty ${key}`);
  return value.trim();
}

function checkFrontmatter(entry, content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  requireCondition(match, `${entry.name}: missing YAML frontmatter`);
  const name = discoveryField(match[1], 'name', entry.name);
  const description = discoveryField(match[1], 'description', entry.name);
  requireCondition(name === entry.name, `${entry.name}: frontmatter name differs from lock`);
  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  requireCondition(
    normalize(description) === normalize(entry.description),
    `${entry.name}: frontmatter description differs from lock`,
  );
}

function checkSource(root, source, entry, files) {
  requireCondition(source && typeof source === 'object', `${entry.name}: invalid source`);
  requireCondition(/^[\w.-]+\/[\w.-]+$/.test(source.repository), `${entry.name}: invalid source repository`);
  requireCondition(/^[a-f\d]{40}$/i.test(source.commit), `${entry.name}: source commit must be 40 hexadecimal characters`);
  requireCondition(typeof source.path === 'string' && source.path.trim(), `${entry.name}: missing source path`);
  requireCondition(typeof source.license === 'string' && source.license.trim(), `${entry.name}: missing source license`);
  const explicitLicense = source.licenseFile ?? source.licenseNotice;
  const licenses = explicitLicense
    ? [explicitLicense]
    : files.filter((file) => /(?:^|\/)(?:LICEN[CS]E|COPYING|NOTICE)(?:\.[\w.-]+)?$/i.test(file))
      .map((file) => `${canonicalRoot}/${entry.name}/${file}`);
  requireCondition(licenses.length > 0, `${entry.name}: no license file or notice`);
  for (const license of licenses) {
    requireCondition(readFile(projectPath(root, license)).trim(), `${entry.name}: empty license file or notice`);
  }
}

function checkDirectories(root, relative, names, allowMissing) {
  const path = projectPath(root, relative, allowMissing);
  const stat = statIfPresent(path);
  if (!stat) return;
  requireCondition(stat.isDirectory(), `Expected directory: ${relative}`);
  const actual = readdirSync(path).sort();
  for (const name of actual) {
    requireCondition(names.has(name), `Unknown skill entry: ${relative}/${name}; remove or register it explicitly`);
    const child = lstatSync(join(path, name));
    requireCondition(child.isDirectory() && !child.isSymbolicLink(), `Expected real skill directory: ${relative}/${name}`);
  }
  if (!allowMissing) {
    for (const name of names) requireCondition(actual.includes(name), `Missing skill directory: ${relative}/${name}`);
  }
}

export function wrapperText(entry) {
  return `---
name: ${JSON.stringify(entry.name)}
description: ${JSON.stringify(entry.description)}
---

# ${entry.name}

This is the Claude Code entry point for a project skill shared with Codex.

1. Read the repository-root instructions at \`../../../AGENTS.md\`.
2. Read and follow the canonical skill at \`../../../.agents/skills/${entry.name}/SKILL.md\`.
3. Resolve supporting links and relative file paths from the canonical skill directory, \`../../../.agents/skills/${entry.name}/\`, rather than this wrapper directory.

The user's request and repository instructions retain precedence. Keep the canonical files as the single source of truth. Regenerate this wrapper from the repository root with \`node scripts/skills.mjs sync\` after changing skill metadata.
`;
}

export function validateSkills(root = repositoryRoot, { forSync = false } = {}) {
  const lock = JSON.parse(readFile(projectPath(root, '.agents/skills-lock.json')));
  requireCondition(lock.schemaVersion === 1, 'Unsupported skills-lock schemaVersion; expected 1');
  requireCondition(lock.canonicalRoot === canonicalRoot && lock.claudeRoot === claudeRoot, 'Unexpected skill root paths in lock');
  requireCondition(Array.isArray(lock.skills) && lock.skills.length > 0, 'The lock must contain skills');
  const names = new Set();
  for (const entry of lock.skills) {
    requireCondition(entry && typeof entry === 'object', 'Invalid skill entry');
    requireCondition(typeof entry.name === 'string' && entry.name.length <= 64 && skillName.test(entry.name), `Invalid skill name: ${entry.name}`);
    requireCondition(!names.has(entry.name), `Duplicate skill name: ${entry.name}`);
    requireCondition(typeof entry.description === 'string' && entry.description.trim(), `${entry.name}: missing description`);
    names.add(entry.name);
  }
  readFile(projectPath(root, 'AGENTS.md'));
  checkDirectories(root, canonicalRoot, names, false);
  checkDirectories(root, claudeRoot, names, forSync);
  let fileCount = 0;
  for (const entry of lock.skills) {
    const directory = projectPath(root, `${canonicalRoot}/${entry.name}`);
    const files = inventory(directory);
    requireCondition(files.includes('SKILL.md'), `${entry.name}: missing SKILL.md`);
    checkFrontmatter(entry, readFile(join(directory, 'SKILL.md')));
    fileCount += files.length;
    if (entry.source !== null) {
      checkSource(root, entry.source, entry, files);
      requireCondition(entry.files && typeof entry.files === 'object' && !Array.isArray(entry.files), `${entry.name}: missing file checksums`);
      const lockedFiles = Object.keys(entry.files).sort();
      requireCondition(JSON.stringify(files) === JSON.stringify(lockedFiles), `${entry.name}: file inventory differs from lock`);
      for (const [file, checksum] of Object.entries(entry.files)) {
        requireCondition(typeof checksum === 'string' && /^[a-f\d]{64}$/i.test(checksum), `${entry.name}/${file}: invalid SHA-256`);
        const path = projectPath(root, `${canonicalRoot}/${entry.name}/${file}`);
        const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
        requireCondition(actual === checksum.toLowerCase(), `${entry.name}/${file}: SHA-256 mismatch`);
      }
    } else {
      requireCondition(entry.files === undefined, `${entry.name}: custom skills must omit vendor checksums`);
    }
    requireCondition(entry.additionalSources === undefined || Array.isArray(entry.additionalSources), `${entry.name}: invalid additionalSources`);
    for (const source of entry.additionalSources ?? []) checkSource(root, source, entry, files);
    const wrapperDirectory = projectPath(root, `${claudeRoot}/${entry.name}`, forSync);
    if (statIfPresent(wrapperDirectory)) {
      const wrapperFiles = inventory(wrapperDirectory);
      requireCondition(wrapperFiles.every((file) => file === 'SKILL.md'), `${entry.name}: unexpected Claude wrapper file`);
      if (!forSync) {
        requireCondition(wrapperFiles.length === 1, `${entry.name}: missing Claude wrapper`);
        requireCondition(readFile(join(wrapperDirectory, 'SKILL.md')) === wrapperText(entry), `${entry.name}: Claude wrapper differs; run skills:sync`);
      }
    }
  }
  return { lock, fileCount };
}

export function syncWrappers(root = repositoryRoot) {
  // Validate every source and existing wrapper path before making any changes.
  const { lock } = validateSkills(root, { forSync: true });
  for (const entry of lock.skills) {
    const directory = projectPath(root, `${claudeRoot}/${entry.name}`, true);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'SKILL.md'), wrapperText(entry), 'utf8');
  }
  return validateSkills(root);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const command = process.argv[2] ?? 'check';
  try {
    requireCondition(process.argv.length <= 3 && ['check', 'sync', '--help', '-h'].includes(command), 'Usage: node scripts/skills.mjs [check|sync]');
    if (command === '--help' || command === '-h') {
      console.log('Usage: node scripts/skills.mjs [check|sync]\ncheck: verify pinned skill files and Claude wrappers (default)\nsync: regenerate only the registered Claude wrappers, then verify');
    } else {
      const { lock, fileCount } = command === 'sync' ? syncWrappers() : validateSkills();
      console.log(`Skills ${command}: ${lock.skills.length} skills, ${fileCount} canonical files, and all Claude wrappers verified.`);
    }
  } catch (error) {
    console.error(`Skills ${command} failed: ${error.message}`);
    process.exitCode = 1;
  }
}
