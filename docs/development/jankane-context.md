# じゃんかねのプロジェクト文脈

開発用の参照地図。記述とコードが異なる場合は、現在の実装・テスト・最新のユーザー指示を確認する。全資料の一括読み込みは不要。

## 課題ごとの入口

| 対象 | 最初に読む実装 | 方針・関連資料 |
| --- | --- | --- |
| 技術構成・コマンド | `package.json`、`vite.config.ts` | [検証ガイド](verification.md) |
| 画面切替・TOP復帰 | `src/App.tsx`、`src/components/layout/` | `docs/design/navigation-flow-review.md` |
| 共通の見た目 | `src/main.tsx`、`src/styles/`、`src/index.css` | `docs/design/obsidian-glass-ui.md`、`docs/design/quiet-loading-open-layout.md` |
| TOPの3D牌 | `src/components/home/tiles/` | `docs/design/jankane-home/README.md`、`docs/design/jankane-home/IMPLEMENTATION.md` |
| 順位表・表彰台 | `src/components/ranking/` | `docs/design/podium-spotlight.md`、`docs/design/quiet-loading-open-layout.md` |
| 単発入力・対局会・精算 | `src/components/input/`、`src/components/layout/RecordSheet.tsx`、`src/lib/inputMode.ts` | `docs/design/navigation-flow-review.md`、`docs/design/participant-picker.md` |
| 雀士・期間の表示条件 | `src/store/useViewPreferences.ts`、`src/lib/season.ts` | `docs/design/navigation-flow-review.md` |
| 計算・統計・段位 | `src/lib/calc.ts`、`stats.ts`、`rankLevel.ts`、`src/types/index.ts` | 対応する `src/tests/` のテスト |
| 保存・同期・権限 | `src/lib/firebase.ts`、`roomRepo.ts`、`src/store/useAppStore.ts`、`firestore.rules` | 下記「保存と同期」 |
| アプデ履歴 | `scripts/update-changelog.mjs`、`.github/workflows/update-changelog.yml` | `.github/pull_request_template.md` |

## 構成と画面

React 19、TypeScript、Vite、Tailwind CSS 4、Zustand 5、Firebase、Three.jsによるSPA。バージョンの正確な値は `package.json` とlockfileで確認する。Next.js・React Router・React Three Fiberは使っていない。

`AppShell` は `activeTab` の状態で画面を切り替える。TOPはリーグ用の共通シェルから独立している。TOP、リーグホーム、順位表、対局入力、対戦履歴、ダッシュボード、段位、成績予想、実績、シーズン、アプデ、ルール、雀士登録、計算設定がある。古い資料にある画面数より `src/App.tsx` を優先する。

対局入力の入口は「1半荘だけ記録」「対局会を開始」「本日の精算」を区別する。対局会の設定中に素点フォームや保存バーを出さない。共通ヘッダーのTOP復帰とメニューのTOPは同じ遷移先を使う。

## デザインと3D

- 基調は黒ガラス、翡翠の選択状態、金の決定操作、太い明朝体。既存の配色・字組み・操作の意味を読む。
- 情報を四角いカードで囲い直さず、余白・見出し・区切り線で整理する。入力欄、主操作、確認ダイアログ、エラー、固定ナビには必要な境界を残す。
- ニューモーフィズムの資料は過去案。現行方針は `obsidian-glass-ui.md` と `quiet-loading-open-layout.md`。
- TOPは指定4原画・4メニュー・ループ軌道・縦スクロール禁止を維持する。`tileMenus.ts` が原画と遷移先の対応を定義する。スワイプ・矢印は選択、メニュー名タップは直接遷移。戻った際の選択を保つ。
- 表彰台の遅延読込と自由回転を保つ。3Dは `loading → webgl / fallback` を区別し、読み込み途中の簡易牌をちらつかせない。
- GPU変更では `tileScene.ts`、`MahjongTileMenu.tsx`、`podiumScene.ts`、`PodiumModel.tsx` を必要な範囲で確認する。画面外・非表示・収束後の描画停止、資源のdispose、読込キャンセル、イベント解除、コンテキスト喪失時の代替表示が検証対象。
- 再描画の最適化は測定・再現する問題を起点にする。R3F向けのAPIやNext専用の規則をこの構成へ持ち込まない。
- reduced-motion、reduced-transparency、フォーカス、文字のコントラスト、WebGL失敗時の操作を維持する。`backdrop-filter` を一覧行やWebGL全体へ大量適用しない。

## 麻雀・集計の条件

変更前に `src/lib/calc.ts`、`src/lib/defaults.ts`、`src/types/index.ts` と対象のテストを確認する。

- 半荘の精算金額は `(素点 + 順位点 − 配給原点) / divider`。順位点にはウマ・オカが含まれる。
- 素点合計は `initialScore * playerCount`。三麻・四麻の人数と順位点の長さを合わせる。既定順位点は四麻 `[30000, 10000, -10000, -30000]`、三麻 `[20000, 0, -20000]`。
- `parseHundredsInput` は入力 `582` を58,200点に変換する。未入力の `null` と0点を区別する。
- 同点の順位は明示的な `tieBreakOrder`、未指定時は入力順を用いる。起家の扱いを推測で変更しない。
- 場代は参加者で均等割りし、端数は切り上げる。チップの合計は0、単価は精算日の `chipRate`。
- `totalWithoutFee` と `totalWithFee` を区別する。順位表と段位は場代抜き、一部のダッシュボードや累積系列は場代込みなので用途を確認する。
- 段位は場代抜きの通算収支から再計算し、昇段・降段がある。地底人は−15,000円未満、魂天は300,000円以上。途中の境界は `RANK_TIERS` を参照する。
- 表示期間の絞り込み、個人とリーグ全体、未精算と精算済みを分ける。通算の段位を期間成績として扱わない。
- `Game.rankPointsUsed`、`DayRecord.session`、`seasonId` 等がない旧データも扱う。保存済み精算値の意味を、現在の設定で無条件に置き換えない。

## 保存と同期

Firestoreを永続化の正とし、Zustandは `onSnapshot` の購読結果を保持する。保存先は `rooms/{roomCode}/state/...` と `rooms/{roomCode}/history/...`。保存を伴う変更は `roomRepo.ts` と `useAppStore.ts` を併せて読む。

現行の `firestore.rules` は匿名認証を含む認証済みクライアントを許可し、ルームコードを共有の境界として扱う。メンバーシップによるアクセス制限とは異なるため、権限変更時は実際のルールから検討する。

同期・保存の不具合を扱う場合は、配列全体の書き戻しによる同時更新、精算時の履歴保存と当日データ消去の順序、購読エラー、ルーム切替時の購読解除を確認する。これは調査対象の地図であり、今回の依頼にない保存形式・認証方式の変更を自動で追加する指示ではない。

UI検証には本番接続のないfixtureを使う。Firebaseの実接続・ルール検証が必要なら、対象環境と操作内容を特定する。既存の本番対局データをテスト用に作成・削除しない。

## 変更差分のレビュー

ユーザーの依頼と受け入れ条件を起点に、関係する既存設計資料を読む。開始時の `origin/main` のSHA、変更ファイル、現在の差分を明示してレビューする。上流が進んだ場合は差分への影響を確認する。

仕様書やIssueの新規作成を一律の前提にしない。依頼から判断できる点は進め、残る不明点だけ確認する。指摘には根拠となるファイル・再現条件・影響を添える。レビューを依頼されただけで自動的にIssueを作らない。

アプデ履歴はPRマージ後に生成される。開発環境だけの変更は既存の `skip-update-log` ラベルでユーザー向け更新から除外できる。`src/data/generatedUpdates.json` を手動で版上げする前に生成フローを確認する。
