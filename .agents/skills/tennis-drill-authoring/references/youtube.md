# YouTube動画の確認

YouTubeの参考資料はyt-dlpで動画をダウンロードし、映像を解析してから練習へ反映する。実行前に`yt-dlp --version`、`ffmpeg -version`、`ffprobe -version`で利用可能か確認する。以下はNode.jsがあるこのプロジェクト向けに`--js-runtimes node`を指定する。JavaScript実行環境が見つからない警告が出たら`node --version`とPATHを確認する。

## 取得

PowerShell例。`$videoUrl`は調査対象の実URLに置き換える。作業ごとに一意の一時フォルダを作り、動画・字幕・メタデータはリポジトリに入れない。

```powershell
$videoUrl = 'https://www.youtube.com/watch?v=VIDEO_ID'
$videoDir = Join-Path ([System.IO.Path]::GetTempPath()) ('tennis-video-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $videoDir | Out-Null
$videoPath = yt-dlp --no-playlist --js-runtimes node --no-progress --write-info-json -f 'bv*[height<=720]+ba/b[height<=720]' --print after_move:filepath -P $videoDir -o '%(id)s.%(ext)s' $videoUrl
if ($LASTEXITCODE -ne 0) { throw '動画の取得に失敗しました。' }
if (-not $videoPath -or -not (Test-Path -LiteralPath $videoPath)) { throw '取得した動画が見つかりません。' }
ffprobe -v error -show_entries format=duration,size:stream=codec_type,width,height -of json $videoPath
if ($LASTEXITCODE -ne 0) { throw '取得した動画を読み取れません。' }
```

まず720p以下で解析し、細かい動作やボールが判別できない箇所だけ画質を上げる。無指定だと最高画質になり、短い調査でもGB単位の取得になり得る。映像・音声の有無と尺を確認し、`.info.json`のタイトル・チャンネル・長さ・チャプターも読む。URLの期限付き情報などを含むメタデータ全体をログへ出さず、必要な項目だけ読む。

必要なら字幕を別途取得する。字幕取得の失敗を動画取得の失敗と混同しない。

```powershell
yt-dlp --no-playlist --js-runtimes node --no-progress --skip-download --write-subs --write-auto-subs --sub-langs 'en,ja' -P $videoDir -o '%(id)s.%(ext)s' $videoUrl
```

言語が見つからない場合は`--list-subs`で確認して必要な言語だけ指定する。`en.*`などで多数の派生字幕を一括取得しない。自動字幕のVTTは同じ行が繰り返されるため、タグ除去・直前行との重複除去を行って時刻付きで読む。まず対象区間を絞り、字幕全文をツール出力へ流して重要箇所が切り捨てられるのを避ける。

長時間動画で対象区間が判明している場合は`--download-sections '*00:01:00-00:02:00'`などで必要な前後を含めて取得できる。切り出し開始時刻を記録し、確認箇所は元動画の時刻で示す。

## 映像の解析と記録

- 利用可能な動画解析機能で映像を確認する。直接動画を読めない場合はffmpegで連続フレームを抽出し、画像閲覧ツールで実際に見る。例は60秒地点から10秒間を毎秒2枚で抽出する。`-ss`を入力より前へ置いて長い動画の冒頭からのデコードを避ける。拡張子を推測せず、取得時に返された`$videoPath`を使う。

```powershell
$frameDir = Join-Path $videoDir 'frames-60s-2fps'
New-Item -ItemType Directory -Path $frameDir | Out-Null
ffmpeg -hide_banner -loglevel error -ss 00:01:00 -i $videoPath -t 10 -vf 'fps=2,scale=960:-2' (Join-Path $frameDir 'frame-%04d.jpg')
if ($LASTEXITCODE -ne 0) { throw 'フレームの抽出に失敗しました。' }
Get-ChildItem -LiteralPath $frameDir -Filter '*.jpg' | Select-Object Name,Length
```

- 抽出画像が実在することを確かめてから閲覧する。区間ごとに保存先を分け、開始時刻・fps・確認したファイルを記録する。概観用の間引き画像だけで動画全体を解析済みとしない。コマごとの時刻はサンプリング間隔の精度で扱い、接触の瞬間などは追加フレームで確認する。
- 動作が速い箇所は抽出間隔を短くし、開始配置、球出し、打球、回復までを連続して確認する。少数の静止画で動きの順番が判別できなければ追加のフレームを確認する。
- 字幕や音声の説明と照合し、人数、用具、球道、移動、狙い、反復条件、コーチの注意点を記録する。自動字幕の誤認や、映像だけでは分からない意図を断定しない。
- 資料の`note`には「01:12–01:38：球出し位置とクロスへの打球、中央への回復を確認」のように、確認した時間帯と内容を記す。区間取得の場合は元動画の時刻に換算する。
- 取得失敗・映像を閲覧できない場合は未確認と報告し、確認できた別資料で進めるか`draft`として扱う。取得成功だけで解析済みとしない。
- ダウンロードした動画は調査用。公開データには元動画へのリンクを残す。参考画像としてフレームを公開する場合は利用条件を確認し、代替テキストと出典クレジットを付ける。
