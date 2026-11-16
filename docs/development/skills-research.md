# じゃんかね開発スキルの調査・選定

調査日：2026年11月17日。対象は React 19 / Vite / TypeScript / Tailwind CSS / Zustand / Three.js / Firebase を使う、既存のじゃんかね開発環境。

## 選定の考え方

UIの完成度、画面遷移と入力の使いやすさ、3D表示の安定性、麻雀計算の正確さ、不具合の再現・レビューを優先した。既存のテスト、デザイン資料、Firebase構成を利用し、関連するスキルだけを作業ごとに読む。

開発方針は、最新のユーザー依頼とプロジェクト資料を基準にする。外部スキルにある一般的な配色・フレームワーク・新規アプリ向けの提案を、既存仕様の変更理由にはしない。

## 採用した9スキル

| スキル名 | 配布元・ライセンス | じゃんかねでの用途 |
| --- | --- | --- |
| `jankane-development` | このプロジェクト専用。第三者スキルの転載ではない | 仕様確認から実装・検証・レビューまでの入口。既存ファイル、麻雀計算、デザイン方針、検証範囲を結び付ける。 |
| `frontend-design` | Anthropic公式 / Apache-2.0 | 太字明朝、黒基調のガラス表現、余白や情報の強弱を整える。既存の牌原画とデザイン方針を保ち、汎用的なカードの量産を避ける。 |
| `vercel-react-best-practices` | Vercel公式 / MIT | 再レンダリング、読み込み順、状態参照、バンドルサイズなどの改善。ViteのSPAに適用できる項目を使い、Next.js専用項目は対象外にする。 |
| `web-design-guidelines` | Vercel公式 / MIT | タッチ操作、キーボード、フォーカス、フォーム、表示状態、動きの低減、スマホの操作性を確認する。 |
| `threejs-performance` | cesartevisual のコミュニティ製 / MIT | 3D麻雀牌の描画コスト、初期化、解放、描画ループ、ピクセル比、低性能端末での挙動を確認する。Three.js公式の提供物ではない。 |
| `diagnosing-bugs` | Matt Pocock本人 / MIT | 再現手順と測定から原因を絞り、修正後に元の症状と回帰を確認する。画面遷移、保存、集計、表示のちらつきに使う。 |
| `code-review` | Matt Pocock本人 / MIT | 固定した基準コミットから、仕様適合とコード品質を別々に確認する。設定は `docs/agents/issue-tracker.md` を参照する。 |
| `codebase-design` | Matt Pocock本人 / MIT | 複雑な状態管理や集計処理を、呼び出し側が理解しやすく検証しやすい構造へ整理する。目的のない抽象化は増やさない。 |
| `firebase-security-rules-auditor` | Firebase公式 / Apache-2.0 | Firestoreなどのルールについて、更新時の検証漏れ、所有者判定、権限昇格、型・サイズの制約を監査する。 |

Firebase監査スキルの導入は、既存の認証や権限ルールが安全であることの証明ではない。監査していない箇所を「確認済み」と記録せず、認証方式・公開範囲・本番ルールの変更とは分けて扱う。

## 固定した取得元

導入内容を再現できるよう、取得時点のコミットを固定する。更新時には差分とライセンスを確認する。

| 取得元 | 固定コミット | 取得対象 |
| --- | --- | --- |
| [anthropics/skills](https://github.com/anthropics/skills) | `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` | `skills/frontend-design/`。ライセンスは同フォルダの `LICENSE.txt`。 |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62` | `skills/react-best-practices/` と `skills/web-design-guidelines/`。MIT表記はREADME、Reactスキルのfrontmatterにも記載。 |
| [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | `434b7f91364665f2f733b310ec54809bf8f37937` | `web-design-guidelines` が参照するルール本文とライセンス。 |
| [cesartevisual/threejs-skills](https://github.com/cesartevisual/threejs-skills) | `84f9bcb4bea1f7a28d57fe7f0af78f7f9c3dc467` | `skills/threejs-performance/` とルートの `LICENSE`。READMEはThree.js本体の開発者とは独立したプロジェクトと明記。 |
| [mattpocock/skills](https://github.com/mattpocock/skills) | `5863806dd4e15c63174bee4e7515a4256792ecfa` | `skills/engineering/` 内の `diagnosing-bugs/`、`code-review/`、`codebase-design/` とルートの `LICENSE`。 |
| [firebase/agent-skills](https://github.com/firebase/agent-skills) | `99954a30898bb5ddc8152ee10e124dc3b4106bf7` | `skills/firebase-security-rules-auditor/` とルートの `LICENSE`。 |

## 導入方式

- 正本は `.agents/skills/` に置く。必要な参照資料・スクリプトを含むフォルダを保存し、`SKILL.md`だけのコピーで参照先が欠けることを防ぐ。
- Claude Codeの入口は `.claude/skills/` の薄いラッパーとし、対応する正本を読む。入口には実ファイルを用い、Windowsのシンボリックリンク設定に依存させない。
- `web-design-guidelines` は、参照するルールを固定コミットから同梱し、ローカルの参照先へ適応する。毎回取得する最新のルールによって、同じコミットのレビュー結果が変わることを避ける。
- プラグイン一式や全スキルの自動更新を追加せず、このリポジトリで内容と変更差分を管理する。
- 作業に必要なスキルを選び、全スキルを毎回読み込まない。モデルや実行環境にないツールをスキルだけで追加できるわけではない。

## 今回採用しなかった候補

| 候補 | 判断理由 |
| --- | --- |
| [mattpocock/skills の全パック](https://github.com/mattpocock/skills) | 今回使わない課題トリアージや大規模計画まで含む。`grill-with-docs`は`grilling`と`domain-modeling`に依存し、段階的な質問と合意を中心に進める。仕様が明確な修正の標準手順にはせず、必要な3本を選んだ。 |
| [Mattのtdd](https://github.com/mattpocock/skills/tree/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/engineering/tdd) | テストの境界を事前に合意する専用の進め方。既存のVitest・Testing Libraryとプロジェクト専用スキルで、変更の重要度に合う確認を行う構成にした。 |
| [obra/superpowers](https://github.com/obra/superpowers) | 設計、計画、実行、レビューを一つの方法論として提供する。採用したデバッグ・レビュー手順と重なり、複数の進行手順が競合しやすいため全体導入しない。 |
| [Cloudflare security-audit-skill](https://github.com/cloudflare/security-audit-skill) | 多段階の本格監査に向く。対象コードを実行する検証には隔離された実行環境が必要。今回はFirebaseルールの監査を優先し、全体監査は別の作業として検討する。 |
| [Firebaseの広範な導入スキル](https://github.com/firebase/agent-skills) | Firestoreの作成・選択や認証の構成・デプロイまで含む。既存環境の改善という目的に合わせ、ルール監査だけを導入する。 |
| OpenMausBot・Sherlock | 複数AIを扱う別アプリと、ユーザー名の横断検索ツール。じゃんかねの設計・描画・計算・テストを改善する今回の対象には含めない。 |

## 運用上の確認

導入が正しく読めること、参照ファイルが存在すること、通常の開発コマンドが動くことを確認する。スキルの導入と、UI・速度・不具合数の改善は区別し、今後の変更でスクリーンショット、再現結果、測定値、テスト結果を残す。

公式の仕組み説明：[Agent Skills仕様](https://agentskills.io/specification)、[Firebase agent skills](https://firebase.google.com/docs/ai-assistance/agent-skills)。
