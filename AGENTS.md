# じゃんかねの開発ガイド

## 作業の始め方

- ユーザーの依頼と受け入れ条件を読み、変更する画面・ロジック・保存データを特定する。分かることは既存コードから確認し、必要のない質問やIssue作成を追加しない。
- `git status --short --branch` で既存の変更を確認する。レビュー対象の基準は、作業開始時の `origin/main` のSHAを記録して明示する。他の作業の変更を戻さない。
- じゃんかねの開発では `.agents/skills/jankane-development/SKILL.md` を入口にし、下表から今回の作業に必要なスキルだけを読む。
- 技術構成・画面・計算の根拠は現在の実装と [プロジェクトの文脈](docs/development/jankane-context.md) を参照する。ユーザーの指示とこのプロジェクトの方針を、外部スキルの一般的な提案より優先する。

## スキルの使い分け

すべて `.agents/skills/` 配下。名前だけで機能を推測せず、使うスキルの `SKILL.md` を読む。

| 作業 | スキル |
| --- | --- |
| 変更範囲・影響・検証の整理 | `jankane-development` |
| 画面の見た目・レイアウトの実装 | `frontend-design` |
| Reactの再描画・状態・読込性能 | `vercel-react-best-practices` |
| 操作性・アクセシビリティのレビュー | `web-design-guidelines` |
| 3D牌・表彰台のGPU描画とライフサイクル | `threejs-performance` |
| 再現する不具合の原因調査 | `diagnosing-bugs` |
| 変更差分と要求の照合 | `code-review` |
| モジュール境界・責務の整理 | `codebase-design` |
| Firestoreの権限・ルーム境界の監査 | `firebase-security-rules-auditor` |

## サブエージェント

Claude Codeは `.claude/agents/<name>.md`、Codexは `.codex/agents/<name>.toml`（本文はClaude側を正本として参照）。明示的に依頼したときに使う。

| 作業 | Claude Code | Codex |
| --- | --- | --- |
| マージ前の差分レビュー（読み取り専用） | `jankane-reviewer` | `jankane_reviewer` |
| 検証コマンドの実行と失敗原因の特定（修正しない） | `jankane-verifier` | `jankane_verifier` |
| 精算・順位・段位・統計の計算とテスト | `jankane-scoring` | `jankane_scoring` |
| Firestoreの保存・購読・ルール | `jankane-firestore` | `jankane_firestore` |

## このアプリの前提

- React・TypeScript・ViteのSPA、Tailwind CSS、Zustand、Firebase、vanilla Three.js。Next.js・React Router・React Three Fiberは使っていない。外部スキルの対象外の規則を適用するために依存や構成を変えない。
- 黒ガラス・翡翠・金・太い明朝体、余白と区切り線を中心にした現行デザインを守る。TOPとリーグホームは別画面。指定された4枚の原画、TOPの縦スクロール禁止、5つの下部タブを維持する。根拠は `docs/design/obsidian-glass-ui.md` と `docs/design/quiet-loading-open-layout.md`。
- 精算・順位・段位は `src/lib/` の純粋関数と既存テストを確認する。点数と円、場代込みと場代抜き、通算と期間別、三麻と四麻を混同しない。UI改善に計算式や保存形式の変更を混ぜない。
- Firestoreの書き込みは `src/lib/roomRepo.ts`、購読状態は `src/store/useAppStore.ts` に集約されている。UI確認は本番データを操作せず、既存の `qa/home-menu.html` を使う。環境変数・サービスアカウント・実データを成果物へ含めない。

## 検証と完了報告

- 開発は `npm run dev`。個別確認は `npm run skills:check`、`npm run lint`、`npm test`、`npm run test:changelog`、`npm run build`。一括確認は `npm run check`。
- 変更に対応する検証を [検証ガイド](docs/development/verification.md) から選ぶ。再現条件を確認し、既存テストを活用する。実装をなぞるだけのテストを増やさない。
- 自動テスト、実ブラウザの表示・操作、iPhone実機、本番Firebaseの確認結果を区別する。実行していない確認を成功扱いしない。
- 変更内容・理由・実行した検証・残る制約を日本語で報告する。PRでは開始時の基準SHAと差分を確認し、要件にない変更や自動Issue起票を増やさない。
