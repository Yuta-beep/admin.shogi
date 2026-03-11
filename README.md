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

## 必要な環境変数

`.env.local` を作成して設定してください。

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PIECE_IMAGE_BUCKET=piece-images
```

Amplify でデプロイする場合は、Hosting の Environment variables にも同じキーを設定してください。
`amplify.yml` でこれらを読み込み、`.env.production` を生成してビルド時に利用します。

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

| メソッド | パス                   | 説明                                    |
| -------- | ---------------------- | --------------------------------------- |
| `GET`    | `/api/pieces`          | 駒一覧・移動パターン・スキル一覧        |
| `POST`   | `/api/pieces`          | 駒作成（multipart/form-data）           |
| `GET`    | `/api/pieces/:pieceId` | 駒詳細（スキル効果・移動範囲・画像URL） |
| `PUT`    | `/api/pieces/:pieceId` | 駒更新（multipart/form-data）           |
| `DELETE` | `/api/pieces/:pieceId` | 駒削除（画像も削除）                    |

### ステージ

| メソッド | パス                   | 説明                                     |
| -------- | ---------------------- | ---------------------------------------- |
| `GET`    | `/api/stages`          | ステージ一覧（名称・使用駒で絞り込み可） |
| `POST`   | `/api/stages`          | ステージ作成（JSON・初期配置含む）       |
| `GET`    | `/api/stages/:stageId` | ステージ詳細（初期配置含む）             |
| `PUT`    | `/api/stages/:stageId` | ステージ報酬更新（初回/通常クリア）      |
