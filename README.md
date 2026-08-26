# Tennis Check

競技者向けテニス練習カタログと、時間経過で色が薄くなる個人チェックリストです。

▶ [Tennis Checkを開く](https://opvelll.github.io/tennis_check/)

## 主な機能

- シングルス中心の標準30項目を、退色マップとカテゴリ別一覧で表示
- チェックから3日を基準に色が薄くなる実施履歴
- 全体の基準日数・倍率と、項目ごとの退色日数設定
- 148項目の名前・目的・タグ検索と条件フィルター
- チェックポイント、条件、安全上の注意、参考動画・資料を表示する詳細画面
- ブラウザのlocalStorageによる個人状態の保存

## 開発

Node.js 24.11以降とpnpm 11.9を使用します。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

開発サーバーでは[データ編集画面](http://localhost:5173/tennis_check/#/editor)から練習データと参考資料を編集できます。編集機能とファイル保存APIはローカル開発時だけ有効で、公開ビルドには含まれません。

確認コマンド：

```sh
pnpm check
```

ローカルURLは [http://localhost:5173/tennis_check/](http://localhost:5173/tennis_check/) です。

## 公開

`master`ブランチへのpushでGitHub Actionsが検査・ビルド・GitHub Pagesへの公開を行います。初回だけリポジトリの Settings → Pages → Source で「GitHub Actions」を選択してください。

公開URL：[https://opvelll.github.io/tennis_check/](https://opvelll.github.io/tennis_check/)

## データ

- [設計書](docs/DESIGN.md)
- [練習カタログの説明](data/README.md)
- [カタログ索引](data/catalog.json)
- [参照資料・動画一覧](data/sources.json)
