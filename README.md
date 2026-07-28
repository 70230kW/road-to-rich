# ROAD to RICH

麻雀の半荘ごとの素点入力から、ウマ・オカの加算、場代の均等割り、チップの精算までを自動で行い、
各雀士の損益額（現金の移動）を可視化・保存するWebアプリです。

## 技術スタック

- **Vite + React + TypeScript** — SPA、タブ切り替えで6画面をシームレスに移動
- **Tailwind CSS v4** — サイバーパンク／グラスモーフィズムのダークテーマ
- **zustand** (`persist` ミドルウェア) — `localStorage` への自動永続化
- **lucide-react** — アイコン
- **Vitest + Testing Library** — 精算ロジックとストアのユニットテスト

## ディレクトリ構成

```
src/
  types/        ドメイン型定義（Player, Settings, Game, DayRecord ...）
  lib/
    calc.ts     精算金額計算・バリデーション・場代/チップ計算（コアロジック）
    stats.ts    ダッシュボード／ランキング／推移グラフ用の集計
    format.ts   表示用フォーマッタ
  store/
    useAppStore.ts   zustand ストア（players/settings/currentDayGames/history）
  components/
    layout/     ヘッダー、タブナビ、背景エフェクト
    common/      共通UI（GlassPanel, ConfirmDialog, ErrorBanner, StatCard ...）
    input/      ① 成績入力・精算タブ
    dashboard/  ② ダッシュボードタブ
    history/    ③ 対戦履歴タブ
    ranking/    ④ ランキングタブ
    settings/   ⑤ 計算設定タブ
    players/    ⑥ 雀士登録タブ
  tests/        vitest ユニットテスト
```

## 計算ロジック

```
精算金額 = (自身の素点 + 順位点 − 配給原点) ÷ 割る数
最終結果 = その日の全ゲーム精算金額の合計 + チップ枚数×単価 − 場代合計÷参加人数
```

順位点（`rankPoints4` / `rankPoints3`）にはウマ・オカを込みで設定します。詳細は `src/lib/calc.ts` を参照してください。

## セットアップ

```bash
npm install
npm run dev       # 開発サーバー
npm test          # ユニットテスト
npm run build     # 型チェック + 本番ビルド
```

## 制約事項

- `alert()` / `confirm()` は使用せず、削除確認やバリデーションエラーはすべてUI内（`ConfirmDialog`, `ErrorBanner`）で表現しています。
- 雀士未登録・履歴なしなど、データが空の状態でも崩れないよう `EmptyState` でプレースホルダーを表示します。
