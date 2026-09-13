# Tennis Check 作業ガイド

## プロジェクト概要

Tennis Checkは、競技者向けのテニス練習カタログと個人チェックリストを提供するReactアプリです。

- React、TypeScript、Viteで構成する。
- 練習カタログは`data/`内の静的JSONで管理する。
- 個人の実施履歴と設定だけをZustandと`localStorage`へ保存する。
- GitHub Pagesのサブパスで公開するため、ルーティングと静的ファイルのパスはベースパスを考慮する。
- ローカル開発時は`#/editor`から練習項目、参考資料、コート配置を編集できる。

詳細仕様は次を参照する。

- 開発・公開方法: [`README.md`](README.md)
- 練習データの規則: [`data/README.md`](data/README.md)
- 画面・データ・コート図の設計: [`docs/DESIGN.md`](docs/DESIGN.md)

## 主なファイル

- `data/catalog.json`: カテゴリ別JSONの索引と項目数
- `data/drills/*.json`: 練習項目
- `data/sources.json`: 参考動画・資料
- `public/images/drills/`: 練習項目の参考画像
- `src/types/catalog.ts`: カタログの型定義
- `src/data/catalog.ts`: JSONの読み込みと項目・資料の関連付け
- `src/editor/validation.ts`: 編集時のデータ検証
- `src/components/court-diagram.tsx`: 共通コート図
- `src/pages/drill-detail-page.tsx`: 練習詳細画面

## プロジェクト専用skill

練習項目・参考資料・参考画像・コート図の追加や更新では、[tennis-drill-authoring](.agents/skills/tennis-drill-authoring/SKILL.md)を読んで作業する。YouTube動画は同skillのyt-dlpによる取得・映像確認手順に従う。

## 完了前の確認

- `pnpm check`でlint、テスト、型チェック、ビルドを通す。
- 画面や表示データを変更した場合は、デスクトップ幅とモバイル幅で、横方向のはみ出し、文字の重なり、画像の欠落がないことを確認する。
- 編集画面を変更した場合は、凡例、選択、クリック、ドラッグ、座標編集を確認する。
- 参考画像やリンクがある場合は、ローカル環境とGitHub Pagesのベースパス付きURLの両方を考慮する。
- `git diff`と`git status`を確認し、利用者の既存変更や無関係なファイルを含めない。

## 作業上の注意

- ユーザーの既存変更を消したり、無関係なファイルを整形したりしない。
- コミット、プッシュ、マージ、公開は、ユーザーが依頼した場合だけ行う。
