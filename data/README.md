# 練習カタログ

`catalog.json`が入口で、大分類ごとのJSONを読み込む。カテゴリ別件数と合計件数は[カタログ索引](catalog.json)を参照する。

## 参照の読み方

- `sources`: 内容を組み立てる際に参照した資料ID。
- `media`: 項目詳細で参考リンクとして表示する資料ID。`video-page`はページ内に動画がある。
- 実URL、提供組織、媒体種別、見る内容は`../data/sources.json`で管理する。
- `status: researched`: 資料中の練習・考え方に直接対応する。
- `status: derived`: 複数資料の原則から実行可能な練習へ構成した。名称はこのカタログ用。

## 編集手順と型定義

追加・更新・出典確認・コート図の整合確認は[プロジェクト専用skill](../.agents/skills/tennis-drill-authoring/SKILL.md)にまとめている。YouTubeはyt-dlpでダウンロードした映像を解析する。

- フィールドの型: [`src/types/catalog.ts`](../src/types/catalog.ts)
- 保存時の検証: [`src/editor/validation.ts`](../src/editor/validation.ts)
- 実カタログの整合検証: [`src/data/catalog.test.ts`](../src/data/catalog.test.ts)（`pnpm check`に含まれる）

## ローカルデータエディタ

`pnpm dev` を起動し、`http://localhost:5173/tennis_check/#/editor` を開く。練習・参考資料の作成、複製、編集、削除と、コート配置の視覚編集ができる。

- 保存APIはloopback接続とカタログ登録済みファイルだけを受け付ける。
- 練習ID、参考資料ID、既存練習の大分類は保存後に変更しない。
- 使用中の参考資料は削除できない。
- 外部でJSONが変更された場合は競合として保存を止め、再読み込みを促す。

## 詳細化に使えるフィールド

既存の型で次を利用できる。練習内容に応じて補完する。

- `setup`: 人・球出し・用具の配置
- `steps`: 実施順序
- `successCriteria`: 回数、深さ、成功率など
- `commonErrors`: よくある失敗
- `progressions` / `regressions`: 難易度調整
- `diagram`: 正規化座標によるコートSVGデータ。`phases`に開始配置・展開など複数の順序付き図を持てる。
- 動画内の確認時刻は参照資料の`note`に記載する。`media`は資料IDの配列であり、`media[].timestamp`は未実装。
