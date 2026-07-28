# ROAD to RICH

麻雀の半荘ごとの素点入力から、ウマ・オカの加算、場代の均等割り、チップの精算までを自動で行い、
各雀士の損益額（現金の移動）を可視化・保存するWebアプリです。

## 技術スタック

- **Vite + React + TypeScript** — SPA、タブ切り替えで6画面をシームレスに移動
- **Tailwind CSS v4** — サイバーパンク／グラスモーフィズムのダークテーマ
- **Firebase (Firestore + Anonymous Auth)** — 共有ルームコード単位でのリアルタイム永続化・複数端末同期
- **zustand** — Firestore の `onSnapshot` を購読するリアクティブなクライアント側キャッシュ
- **lucide-react** — アイコン
- **Vitest + Testing Library** — 精算ロジックとストア（Firestoreはモック）のユニットテスト

## ディレクトリ構成

```
src/
  types/        ドメイン型定義（Player, Settings, Game, DayRecord ...）
  lib/
    calc.ts     精算金額計算・バリデーション・場代/チップ計算（コアロジック）
    stats.ts    ダッシュボード／ランキング／推移グラフ用の集計
    format.ts   表示用フォーマッタ
    firebase.ts  Firebase App/Auth/Firestore 初期化、匿名サインイン
    roomRepo.ts  Firestore CRUD + onSnapshot 購読（rooms/{roomCode}/...）
    roomCode.ts  ルームコードの正規化・生成（純粋関数）
    defaults.ts  既定の計算設定
  store/
    useAppStore.ts   zustand ストア。Firestore の購読結果を保持し、
                     操作は roomRepo への非同期書き込みとして実装
  components/
    layout/     ヘッダー、タブナビ、背景エフェクト
    common/      共通UI（ConfirmDialog, ErrorBanner, StatCard ...）
    room/       ルーム参加画面（RoomGate）、ルームバッジ（RoomBadge）
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
cp .env.example .env.local   # Firebase設定値を入力（下記参照）
npm run dev       # 開発サーバー
npm test          # ユニットテスト
npm run build     # 型チェック + 本番ビルド
```

## Firebase セットアップ

1. **Firestore を有効化**: Firebase Console > 構築 > Firestore Database > データベースの作成（ネイティブモード、ロケーションは任意）。
2. **匿名認証を有効化**: Firebase Console > 構築 > Authentication > Sign-in method > 「匿名」を有効にする。
   ログイン画面なしで各端末を自動的に識別するために使用します（実名やメールアドレスの入力は不要）。
3. **セキュリティルールを設定**: Firebase Console > Firestore Database > ルール に、リポジトリ直下の
   [`firestore.rules`](./firestore.rules) の内容を貼り付けて公開する。
   （匿名認証済みのクライアントであれば `rooms/{roomCode}` 配下を読み書きできる、というルールです。
   ルームコード自体が合言葉の役割を果たすので、他人に教えないコードを使ってください。）
4. **Web アプリの設定値を取得**: Firebase Console > プロジェクトの設定 > 全般 > マイアプリ で
   Web アプリを追加し、表示される `firebaseConfig` の値を `.env.local` に転記する（`.env.example`参照）。
5. `npm run dev` で起動し、初回はルームコード入力画面が表示されます。同じコードを入力した端末同士で
   雀士・対局データがリアルタイムに共有されます。

## 制約事項

- `alert()` / `confirm()` は使用せず、削除確認やバリデーションエラーはすべてUI内（`ConfirmDialog`, `ErrorBanner`）で表現しています。
- 雀士未登録・履歴なしなど、データが空の状態でも崩れないよう `EmptyState` でプレースホルダーを表示します。
