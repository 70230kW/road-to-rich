# じゃんかねのAI開発環境

このリポジトリには、じゃんかね専用の開発フローと8本の専門スキルを同梱している。Codexは `.agents/skills/`、Claude Codeは `.claude/skills/` の入口から同じ内容を読む。プロジェクトを開くと使える構成で、追加の有料プラグイン契約やMCPサーバー設定は不要。AI本体の利用条件・上限は各サービスに従う。

## 使い始める

最新の `main` を取得した作業フォルダでCodexまたはClaude Codeを開く。プロジェクト外のチャットや、別の古いチェックアウトにはこの変更は反映されない。ルートの `AGENTS.md` と `CLAUDE.md` には、作業に応じてスキルを選ぶ指示がある。

通常は日本語で変更を依頼すればよい。明示する場合はCodexで `$jankane-development`、Claude Codeで `/jankane-development` を使う。候補表示が更新されない場合はスキル一覧を再読み込みする。Claude Codeでは `/reload-skills` を使用できる。

```text
じゃんかねの開発スキルを使って、対局入力をスマホで操作しやすくして。
現在の黒基調・太字明朝のデザインと集計ルールを保ち、
実装後は入力から保存までの操作と、必要な回帰確認まで進めて。
```

## 用途別の依頼例

| 目的 | 使うスキル | 依頼例 |
| --- | --- | --- |
| 機能の追加・修正全般 | `jankane-development` | 「影響範囲と確認条件を整理してから実装して」 |
| 見た目の質を上げる | `frontend-design` | 「牌を主役に、情報の強弱と字組みを整えて」 |
| スマホで迷わず操作できるようにする | `web-design-guidelines` | 「入力、フォーカス、下部ナビ、モーダルを点検して」 |
| Reactの処理を軽くする | `vercel-react-best-practices` | 「順位表の不要な再描画を調べ、測定に基づいて改善して」 |
| 3D牌の動作を改善する | `threejs-performance` | 「初回表示と操作中の負荷を分けて調べて」 |
| 原因の分からない不具合を直す | `diagnosing-bugs` | 「再現条件を作り、原因を確かめてから修正して」 |
| 構造を整理する | `codebase-design` | 「この変更で複雑になった状態管理を整理して」 |
| 変更を確認する | `code-review` | 「開始時の基準SHAと今回の依頼を渡すので、仕様とコード品質を確認して」 |
| Firebaseルールを確認する | `firebase-security-rules-auditor` | 「現行のルーム共有方式を踏まえてFirestoreルールを監査して」 |

## 開発コマンド

```bash
npm ci
npm run skills:check
npm run check
```

`skills:check` はスキル名、参照資料のファイル一覧、固定したファイルのSHA-256、ライセンス表示、Claude Codeの入口を照合する。`check` はその後にlint、Vitest、アプデ履歴生成のテスト、本番ビルドを実行する。同じ検証をGitHub Actionsの「Development quality」でPRとmain更新時に実行する。

UIや3D変更の実ブラウザ確認は [検証ガイド](verification.md) のfixtureを使う。今回の導入自体はスキルと開発設定の追加であり、アプリの見た目・計算・Firebaseルールを変更するものではない。

## スキルを保守する

取得元、固定コミット、ライセンス、適応内容、ファイルのハッシュは `.agents/skills-lock.json` にある。[調査・選定記録](skills-research.md) に採用理由と見送った候補を残している。

- 外部スキルを更新する場合は、取得元の差分とライセンスを読んで必要な変更だけ取り込み、固定コミット・適応内容・ファイル一覧・SHA-256を同時に更新する。検証を通すためだけにハッシュを更新しない。
- `jankane-development` とプロジェクト資料はこのアプリの実装に合わせて保守する。外部スキルの原本と区別し、全スキルの指示を一括で読み込ませない。
- スキル名や説明を変えた場合は、正本とlockを揃えて `npm run skills:sync` を実行する。これは登録済みのClaude Codeの入口だけを再生成する。
- `npm run skills:check` と変更に対応する確認を実行し、差分をレビューする。未知のスキルやファイルを検証スクリプトが自動削除することはない。

関連資料：[プロジェクトの文脈](jankane-context.md)／[検証ガイド](verification.md)／[課題とレビューの設定](../agents/issue-tracker.md)。
