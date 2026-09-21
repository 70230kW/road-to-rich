import assert from 'node:assert/strict';
import test from 'node:test';
import { bumpVersion, createUpdateFromPullRequest, updateChangelog } from './update-changelog.mjs';

test('bumps semantic versions with three parts', () => {
  assert.equal(bumpVersion('2.3.0'), '2.3.1');
  assert.equal(bumpVersion('2.3.9', 'minor'), '2.4.0');
  assert.equal(bumpVersion('2.9.9', 'major'), '3.0.0');
});

test('creates structured Japanese patch notes from the PR update table', () => {
  const update = createUpdateFromPullRequest({
    number: 80,
    title: 'feat: 自動更新を追加',
    body: `<!-- update:bump=minor -->\n<!-- update:title=アプデを自動化 -->\n<!-- update:summary=PRのマージから履歴を作成しました。 -->\n## アプデ\n| 対象 | 変更内容 |\n| --- | --- |\n| アプデ | PRの内容を自動で追加しました。 |`,
    labels: [],
    merged_at: '2026-09-21T01:00:00.000Z',
  }, '2.3.0');

  assert.equal(update.version, '2.4.0');
  assert.equal(update.date, '2026.09.21');
  assert.equal(update.title, 'アプデを自動化');
  assert.deepEqual(update.items, [{ target: 'アプデ', change: 'PRの内容を自動で追加しました。' }]);
});

test('falls back to the PR change bullets and ignores duplicate events', () => {
  const pullRequest = {
    merged: true,
    number: 81,
    title: 'fix: 表示崩れを修正',
    body: '## 変更内容\n### モバイル表示\n- ナビとの重なりを修正',
    labels: [],
    merged_at: '2026-09-21T02:00:00.000Z',
  };
  const data = { currentVersion: '2.3.0', lastProcessedPr: 82, processedPrs: [79, 82], updates: [] };
  const first = updateChangelog({ pull_request: pullRequest }, data);
  assert.equal(first.changed, true);
  assert.equal(first.data.currentVersion, '2.3.1');
  assert.deepEqual(first.data.processedPrs, [79, 82, 81]);
  assert.deepEqual(first.data.updates[0].items, [{ target: 'モバイル表示', change: '「ナビとの重なりを修正」を反映しました。' }]);
  assert.equal(updateChangelog({ pull_request: pullRequest }, first.data).changed, false);
});
