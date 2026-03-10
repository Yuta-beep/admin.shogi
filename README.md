# admin.shogi

将棋アプリの管理画面です。現状は `m_piece` 向け CRUD（作成/更新/削除）と画像アップロード機能を実装しています。

## Tech Stack

- TypeScript
- Next.js (App Router)
- React
- Tailwind CSS
- Supabase (Postgres + Storage)
- Bun

## 画面

- `/pieces`
  - 駒作成フォーム
  - 駒一覧テーブル
  - 編集 / 削除

## 実装方針

- `app/` は routing のみ
- 実装は `src/` に集約
- component は atomic architecture
- DBアクセスは `src/features/piece/api/dao`
- create/update/delete は usecase で分離

## 必要な環境変数

`.env.local` を作成して設定してください。

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PIECE_IMAGE_BUCKET=piece-images
```

## セットアップ

依存を先にインストールしてください。`next: command not found` は未インストール時に発生します。

```bash
bun install
```

## 開発

```bash
bun run dev
```

## 品質チェック

```bash
bun run test
bun run format
bun run lint
bun run typecheck
bun run build
```

まとめて実行:

```bash
bun run check
```

## API

- `GET /api/pieces`
  - 駒一覧 + 移動パターン一覧 + スキル一覧
- `POST /api/pieces`
  - multipart/form-data で駒作成
- `PUT /api/pieces/:pieceId`
  - multipart/form-data で駒更新
- `DELETE /api/pieces/:pieceId`
  - 駒削除（画像も削除を試行）
