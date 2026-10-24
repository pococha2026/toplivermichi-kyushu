# 現行版の更新ガイド

資料全体は[一覧](INDEX.md)、現在の仕様は[GAME_SPEC.md](../GAME_SPEC.md)を参照。過去版ごとの説明は[更新履歴](history/CHANGELOG.md)で確認する。

## いつもの更新

Python 3.10以上・Node.js・Gitが必要。Windowsでは環境に応じてpython3をpythonへ読み替える。Windows実機の動作は未確認。

1. `python3 scripts/update.py doctor` で入力・管理情報・公開物・ロック・復旧ファイルを確認する。
2. 下表の編集元とGAME_SPEC.mdを更新し、VERSION.txtの1行目を新しい版、2行目を公開日（YYYY-MM-DD）へ変更する。
3. `python3 scripts/update.py prepare` で生成・関連検査をまとめて実行する。版・日付は `--version` と `--date` でも指定できる。
4. `python3 scripts/update.py audit` で文書リンクと検査登録を確認。公開前は `python3 scripts/update.py check --full` で全ゲーム検査を行う。
5. 差分を確認し、編集元・生成物・仕様・版情報を同じコミットへ保存する。
6. 公開後、`python3 scripts/update.py verify-public` で6ファイル一致を確認し、配布用の制作指示書も同じ内容にする。

ChatGPTへの更新依頼は検証後の公開同期まで含み、毎回の公開確認は不要。下書き・未公開の明示指定は優先する。コマンド自体はコミットや公開を行わない。GitHub保存と実際の公開配信を区別する。

`plan` と通常の `check` は未コミット変更を基準にする。コミット済みの変更は `--base HEAD^` 等で指定する。リネームの移動元・移動先は両方検査する。未分類のsrcは全ゲーム検査へ回す。Git情報がないZIP展開先でも `check --full` は利用できる。

## どこを編集するか

|変更内容|編集元|関連する確認|
|---|---|---|
|HTMLの枠・読込順|`src/index.template.html`|ビルド一致・画面生成|
|基本表示・追加の図鑑表示|`src/styles/base.css`|関連する表示テスト|
|MAP・戦闘・ボタン・スマホ配置|`src/styles/game.css`|`test-map-catalog-ui.cjs`、`test-map-travel-layout.cjs`|
|敵・職業・道具・基本シナリオ|`src/game/data.js`|`test-comprehensive.cjs`|
|計算・条件・報酬・全国MAP定義|`src/game/core.js`|`test-deep-regression.cjs`、`test-national-map.cjs`|
|ドット描画|`src/game/art.js`|`test-regional-art.cjs`（任意依存が必要）|
|BGM・効果音|`src/game/audio.js`|`test-av.cjs`|
|保存・排他・実行状態|`src/game/save.js`|`test-focused-debug.cjs`|
|画面・図鑑・メニュー表示|`src/game/views.js`|`test-mobile-dex.cjs`、`test-map-catalog-ui.cjs`|
|購入・装備・各ボタンの処理|`src/game/actions.js`|`test-interactions.cjs`|
|画面位置・起動・スティック・キー入力|`src/game/input.js`|`test-retired-map-controls.cjs`、`test-map-travel-layout.cjs`|
|ゲーム仕様|`GAME_SPEC.md`|同期検査|
|版番号・日付|`VERSION.txt`|同期検査|

ファイルは既存の区切りで分けているため、一部の関連処理は複数ファイルにまたがる。関数名は `rg '関数名' src/game` で検索する。

## 生成物・検査設定

- index.html、GAME_SPEC.txt、release-manifest.jsonは生成物。直接編集しない。
- 版と日付はVERSION.txtが正本。アプリと仕様書の見出しへ自動反映する。版・日付だけの変更は仕様本文の更新として扱わない。
- config/test-suites.jsonのalways/fullはローカルとCIの共通一覧。relatedの検査はalways/fullにも登録する。optionalは追加依存が必要な任意検査。
- `python3 scripts/lib/build.py --check` は読み取り専用の一致検査。旧来の単独生成モードは廃止し、生成はprepareまたはscripts/lib/release.py --writeへ統一した。
- `audit` はローカルMarkdownリンクと未登録の検査を検出する。外部URLの有効性や、ファイルが意味的に不要かどうかを自動判定しない。

## エラー・中断からの復旧

`doctor` は読み取り専用。不正な版・日付、壊れたmanifest、未生成・不一致の公開物、検査設定、ロックPIDと回復用フォルダーを表示する。編集中のファイルと生成物が不一致なら、内容を確認してprepareを実行する。

|状況|対応|
|---|---|
|ソース追加忘れ・重複・欠落|src/index.template.htmlの指定と実ファイルを一致させる|
|未解決のテンプレート変数|変数名を修正して再生成|
|構文・検査エラー|表示された箇所を修正。成功するまで公開しない|
|既存ロック|実際の更新プロセスを確認。稼働中のロックを削除しない|
|.release-stage-*が残存|old/の回復用ファイルと公開物の整合性を確認し、復旧後に残存物を手動で解決|
|文書リンク切れ・検査未登録|auditの表示位置やtest-suites.jsonを修正|
|公開ファイル不一致|配信完了を確認しverify-publicを再実行。先に公開完了と案内しない|

通常のI/O例外やPythonが捕捉できるCtrl+Cでは生成物を復元する。OS強制終了・停電では復旧処理を実行できない。ロックや回復用ファイルは自動削除せず、別の更新で上書きしない。prepareは関連検査が終わるまでロックを保持する。

## 公開先

- プレイ： https://pococha2026.github.io/toplivermichi-kyushu/
- 最新仕様TXT： https://pococha2026.github.io/toplivermichi-kyushu/GAME_SPEC.txt

ブラウザ自動デバッグは行わない。構文・VM・画面生成検査を実機の描画・タッチ確認と同一視しない。

## 編集と生成が重なった場合

生成中に入力の変更を検出すると `Inputs changed during release generation` と表示して置換前に停止する。編集したREADME・仕様・ソース・版情報は保持するため、編集を終えてprepareをやり直す。版の一時設定を戻す処理も、手動編集で置き換わった新版は上書きしない。

doctorはsrcと生成済みHTMLの差も検出する。版・日付の検証は共通で、全角数字や20261024形式は受け付けない。日付は2026-10-24のようなYYYY-MM-DD形式にする。ソースのVERSION・BUILD_DATEはそれぞれ1か所の変数を維持し、固定値に戻さない。

一時的な版番号の保存・復元も、生成物と共通のファイル置換処理を使う。部分書き込みの例外では元の入力を維持し、既に手動で変更された版番号は一時設定の巻戻しで消さない。

## 検査・公開照合の途中で編集した場合

検査前に編集元・公開物・検査プログラム・資料の状態を記録し、各検査後にも確認する。`Inputs changed during checks` が出た場合は、その回の結果を公開判断に使わず、編集を終えて検査をやり直す。

verify-publicは最初にローカルの整合性を調べる。古い生成物はprepareで更新し、実行中の更新や未解決の復旧状態があれば先に解決する。照合中の入力変更や新しいロックを検出すると6件の一致結果を無効にするため、落ち着いた状態で再実行する。照合は確認時点の一致であり、その後の編集を常時監視する機能ではない。

## 役割別の配置（v8.81）

|場所|用途|
|---|---|
|scripts/update.py|普段使う更新コマンド。入口は移動しない|
|scripts/lib/|build.py（HTML生成）、release.py（配布物同期）、audit.py（文書・検査登録の監査）|
|config/test-suites.json|ローカル・CIの共通検査設定|
|tests/maintenance/|更新・保存復旧・公開確認などPythonの検査|
|tests/game/|ゲーム動作のNode.js検査|
|tests/support/|ゲームを検査用に読み込む共通処理|
|tests/optional/|追加描画依存が必要な任意検査|
|docs/data/|地理・ご当地品などの根拠データ|
|docs/reports/|直近の検証、進捗、過去記録を統合したarchive.json|
|docs/history/|過去の更新説明|

旧ファイルの移動先と統合先は[対応表](structure-v8.81.json)を参照。過去31版の検証記録はarchive.jsonのreports内に元のファイル名をキーとして収録し、内容のハッシュを照合する。旧配置に重複コピーは残さない。公開用のルート6ファイルとプレイURLは維持する。
