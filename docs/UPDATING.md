# 更新ガイド

## いつも使う手順

1. 下表から編集元を選び、変更する。公開用 `index.html` は直接編集しない。
2. 実装した変更を `GAME_SPEC.md` に記載し、README冒頭に変更点を書く。
3. `VERSION.txt` の1行目を新版、2行目を公開日（YYYY-MM-DD）にする。版番号の正本はこのファイルだけ。
4. リポジトリ直下で `python3 scripts/sync-release.py --write` を実行する。
5. `python3 scripts/sync-release.py --check` と変更内容に対応する既存テストを実行する。
6. `git diff` を確認し、編集元・生成物・仕様・版情報を同じコミットで保存する。
7. 公開処理が完了したら、プレイURLと同階層の `VERSION.txt`・`release-manifest.json`・`GAME_SPEC.txt` を確認する。GitHubへの保存とPagesへの配信完了を区別する。

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

## 生成物と検査

- `index.html`：CSSとJavaScriptを元の順番で埋め込む単一HTML。別ファイルの取得待ちや保存キー変更は追加しない。
- `GAME_SPEC.txt`：GAME_SPEC.mdから生成する配布用テキスト。
- `release-manifest.json`：公開用5ファイルのハッシュと版情報。手編集しない。
- `python3 scripts/build-game.py --check`：編集元とHTMLだけの一致を検査。
- `python3 scripts/test-source-build.py`：元コードとの同値性、連結順、未反映の変更を検査。
- `python3 scripts/test-release-sync.py`：版・TXT・manifestの不一致を検査。

JavaScriptは分割後も同じscript内の共有スコープで実行する。ファイルの順番変更、module化、保存世代の変更は通常の整理とは別の変更として検証する。

## 公開先

- リポジトリ： https://github.com/pococha2026/toplivermichi-kyushu
- プレイ： https://pococha2026.github.io/toplivermichi-kyushu/
- 最新仕様TXT： https://pococha2026.github.io/toplivermichi-kyushu/GAME_SPEC.txt

最新版の共有には `?v=VERSION.txtの版番号` を付けられる。公開版の照合はmanifest記載の5ファイルのSHA-256で行う。ブラウザ自動デバッグは行わない。構文検査や画面生成テストを実機のタッチ・音の確認と呼ばない。
