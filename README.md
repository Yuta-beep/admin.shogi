# admin.shogi

将棋アプリの管理画面です。駒マスタ・ステージマスタの CRUD と画像アップロード機能を実装しています。

## Tech Stack

- TypeScript
- Next.js 14 (App Router)
- React
- Tailwind CSS
- Supabase (PostgreSQL + Storage)
- Bun

## 画面

- `/pieces` — 駒一覧（検索・作成・詳細・更新・削除）
- `/pieces/new` — 駒作成
- `/pieces/:pieceId` — 駒詳細（移動範囲・スキル効果）
- `/pieces/:pieceId/edit` — 駒更新
- `/stages` — ステージ一覧（検索・作成・詳細）
- `/stages/new` — ステージ作成（盤面初期配置）
- `/stages/:stageId` — ステージ詳細

## アーキテクチャ

責務を層で分離しています。

```
src/
  app/                      # ルーティング層
    api/                    # API Route（パース → UseCase → レスポンスのみ）
      pieces/
      stages/
    pieces/                 # ページ
    stages/
  api/                      # バックエンド層
    model/                  # ドメイン型定義
    dao/                    # DBアクセス（Supabase）
    useCase/                # ビジネスロジック
    helpers/                # APIレスポンス・パラメータ共通処理
  components/               # UIコンポーネント（Atomic Design）
    layout/                 # レイアウト
    atoms/
    molecules/
    organisms/
    templates/
  hooks/                    # クライアントサイド状態管理
  lib/                      # Supabase クライアント
  types/                    # フロントエンド向け型定義
  utils/                    # フロントエンド向けユーティリティ
```

### 層の責務

| 層 | 役割 |
|---|---|
| `app/api/` | リクエスト受付・レスポンス返却のみ。ビジネスロジックは持たない |
| `api/useCase/` | ビジネスロジックの集約。DAO を組み合わせて処理を完結させる |
| `api/dao/` | Supabase へのクエリ。DB 固有の入力型を自身で定義する |
| `api/model/` | ドメイン型。フロントエンド・バックエンド共用 |
| `components/templates/` | ページ相当のコンポーネント。hooks から状態を受け取り表示 |
| `hooks/` | API 呼び出し・フォーム状態管理。テンプレートに渡す |

### API レスポンス形式

全エンドポイント統一形式：

```ts
// 成功
{ success: true, data: T }

// 失敗
{ success: false, error: string }
```

## 必要な環境変数

`.env.local` を作成して設定してください。

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PIECE_IMAGE_BUCKET=piece-images
```

## セットアップ

```bash
bun install
```

## 開発

```bash
bun run dev
```

## 品質チェック

```bash
bun run typecheck
bun run lint
bun run format
bun run test
bun run build
```

まとめて実行:

```bash
bun run check
```

## API

### 駒

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/pieces` | 駒一覧・移動パターン・スキル一覧 |
| `POST` | `/api/pieces` | 駒作成（multipart/form-data） |
| `GET` | `/api/pieces/:pieceId` | 駒詳細（スキル効果・移動範囲・画像URL） |
| `PUT` | `/api/pieces/:pieceId` | 駒更新（multipart/form-data） |
| `DELETE` | `/api/pieces/:pieceId` | 駒削除（画像も削除） |

### ステージ

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/stages` | ステージ一覧（名称・使用駒で絞り込み可） |
| `POST` | `/api/stages` | ステージ作成（JSON・初期配置含む） |
| `GET` | `/api/stages/:stageId` | ステージ詳細（初期配置含む） |
