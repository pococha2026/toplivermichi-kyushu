# 更新ガイド

## まず使う4つのコマンド

リポジトリ直下で実行。Windowsは環境により `python3` を `python` に読み替える。Python 3.10以上、Node.js、Gitが必要。追加のPythonパッケージは不要。ソースはUTF-8で読み、構文検査用ファイルは閉じてからNode.jsへ渡すため、Windowsの一時ファイル共有制約にも対応する。Windows実機での実行は未確認。

```bash
# 変更した場所と関連検査を表示（読み取りだけ）
python3 scripts/update.py plan
# 版と日付を設定し、生成と関連検査をまとめて実行（次回の版の例）
python3 scripts/update.py prepare --version 8.76 --date 2026-10-25
# すべての既存ゲーム検査を実行（公開直前や広範囲の変更時）
python3 scripts/update.py check --full
# 公開した後、6ファイルの一致を確認（不一致・通信失敗は終了コード1）
python3 scripts/update.py verify-public
```

これらのコマンド自体は公開しない。公開は検査成功と差分確認後に行う。版番号と日付は `VERSION.txt` が唯一の編集元。アプリのビルド日・仕様の日付も自動生成。日付だけ変更する場合は `prepare --date YYYY-MM-DD` を使う。

`plan` と通常の `check` は未コミットの変更から関連検査を選ぶ。コミット後にその差分を調べるには `plan --base HEAD^` または `check --base HEAD^`。CIは `check --full` を使い、変更検知に依存せず全検査を行う。対象一覧は `scripts/checks.json` の1か所で管理する。

## エラーが出た時

|表示|直し方|
|---|---|
|Sources missing from template|新規JS/CSSをsrc/index.template.htmlの正しい順番へ追加|
|Duplicate source include|同じファイルの重複指定を取り除く|
|Missing source include|ファイル名や移動先とテンプレート指定を一致させる|
|Unresolved template placeholder|変数名の誤記を修正|
|Out-of-sync release files|prepareを実行し、生成結果を確認|
|JavaScript構文エラー|表示された行付近を直し、prepareを再実行|
|公開照合が不一致|デプロイ完了を確認し、verify-publicを再実行。先に公開完了と案内しない|

構文エラーでは生成物を上書きしない。テスト失敗は生成成功後にも起こり得るため、失敗した検査を直して再実行する。公開処理は自動では始まらない。

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

## 更新依頼時の公開同期

ユーザーの継続指示により、ChatGPTへ依頼した更新は検証後に既存公開版へ同期する。v8.75以降、通常の更新ごとに公開確認を取り直さない。GitHubへの反映だけで完了とせず、公開サイトの6ファイル一致と配布指示書の同期を確認する。下書き・未公開の指定がある場合はその指定を優先する。失敗や競合は隠さず未完了として報告する。ローカルのupdate.pyコマンド自体はコミット・公開を行わない。

## v8.76 復旧と検査対象の扱い

- index.htmlを失った場合も、srcと仕様があればprepareで再生成できる。srcが存在する状態でテンプレートを消した場合は明示エラーにする。
- 通常の書込エラーは置換前へ復元する。復元も失敗した場合はエラーに表示された `.release-stage-…` 内の `old/` を復旧に使う。原因を確認する前にこのフォルダーを消さない。停電や強制終了、同時更新は別途確認が必要。
- 検査設定不正やGit差分取得の失敗はprepareの生成前に停止する。
- 未分類のsrcファイルは検査を省略せず全ゲーム検査へ回す。
- ZIP展開等でGit情報がなくても `check --full` は実行可能。planや差分に基づくprepare/checkにはGit情報が必要。
- 版や日付の見出しだけを直しても、ゲーム変更に必要な仕様本文の更新として扱わない。
