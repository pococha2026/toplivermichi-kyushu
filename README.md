# トップライバーへの道 全国ツアー編（公開版 v8.76）

アイドルグループ「おやすみセカイ」を脱退したヒロインと主人公が全国を巡り、九州のS6到達から東京ドーム満員公演を目指す、昭和風ドットのスマホ向けRPGです。

**プレイ： https://pococha2026.github.io/toplivermichi-kyushu/**

- [更新ガイド・編集先一覧](docs/UPDATING.md)
- [現行仕様](GAME_SPEC.md) ／ [配布TXT](GAME_SPEC.txt)
- [過去の更新履歴](docs/CHANGELOG.md)
- [項目別デバッグの進捗](docs/debug-progress.json)

## v8.76 今回の更新

- 生成HTMLの欠落からの再生成と、テンプレート欠落の明示エラーを追加。
- 版番号だけの変更による仕様更新チェックのすり抜けを防止。
- ファイル置換中のI/O失敗時に生成物を戻し、復旧失敗時は回復用ファイルを保持。
- 不正な検査設定を先に検出。未分類のソースは全検査へ、全検査はGit情報なしでも実行。
- ゲーム本体・画面・セーブ形式は維持。

## 更新の入口

リポジトリ直下で実行。Python 3.10以上・Node.js・Gitが必要です。Windowsでは環境に応じてpython3をpythonに読み替えます。

```bash
# 変更箇所と関連検査を見る
python3 scripts/update.py plan
# 編集後に生成と検査（版と日付は次回更新の例）
python3 scripts/update.py prepare --version 8.77 --date 2026-10-25
# 公開前の全検査
python3 scripts/update.py check --full
# 公開後の6ファイル照合
python3 scripts/update.py verify-public
```

コマンドはコミット・公開を行いません。公開と配布物の一致確認は別の工程です。

## 構成

|場所|役割|
|---|---|
|`src/`|ゲームの編集元。HTMLテンプレート、CSS、データ・計算・描画・音・保存・画面・操作|
|`VERSION.txt`|版番号と日付の正本|
|`GAME_SPEC.md`|ゲーム仕様の編集元|
|`scripts/update.py`|更新・検査・公開照合の入口|
|`scripts/checks.json`|ローカルとCI共通の検査一覧|
|`index.html`・`GAME_SPEC.txt`・`release-manifest.json`|自動生成する公開物。直接編集しない|
|`docs/`|更新ガイド、変更履歴、資料、検証記録|

生成と同期は従来の `python3 scripts/sync-release.py --write` ／ `--check` でも実行できます。変更に応じた検査は更新ガイドを参照してください。ブラウザ自動デバッグは行いません。

## 更新依頼時の公開同期

ユーザーの継続指示により、ChatGPTへ依頼した更新は検証後に既存公開版へ同期する。v8.75以降、通常の更新ごとに公開確認を取り直さない。GitHubへの反映だけで完了とせず、公開サイトの6ファイル一致と配布指示書の同期を確認する。下書き・未公開の指定がある場合はその指定を優先する。失敗や競合は隠さず未完了として報告する。ローカルのupdate.pyコマンド自体はコミット・公開を行わない。
