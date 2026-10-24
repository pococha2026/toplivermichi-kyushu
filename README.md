# トップライバーへの道 全国ツアー編（公開版 v8.85）

アイドルグループ「おやすみセカイ」を脱退したヒロインと主人公が全国を巡り、九州のS6到達から東京ドーム満員公演を目指す、昭和風ドットのスマホ向けRPGです。

**プレイ： https://pococha2026.github.io/toplivermichi-kyushu/**

- [資料一覧](docs/INDEX.md) ／ [更新ガイド・編集先一覧](docs/UPDATING.md)
- [現行仕様](GAME_SPEC.md) ／ [配布TXT](GAME_SPEC.txt)
- [過去の更新履歴](docs/history/CHANGELOG.md)
- [項目別デバッグの進捗](docs/reports/progress.json)

## v8.85 今回の更新

- 各キャラの所持品から、最強/職業別おすすめの3部位を自動設定。
- ショップで最強品/価格と強化幅を重視するおすすめ品を提案し、選んで購入確認へ。
- 他の仲間の装備・購入条件・在庫数を保護し、候補と能力差を表示。

## 更新の入口

リポジトリ直下で実行。Python 3.10以上・Node.js・Gitが必要です。Windowsでは環境に応じてpython3をpythonに読み替えます。

```bash
# 更新前に不足入力・ロック・復旧ファイルを診断
python3 scripts/update.py doctor
# 変更箇所と関連検査を見る
python3 scripts/update.py plan
# 編集後、VERSION.txtの版・日付を更新して生成と検査
python3 scripts/update.py prepare
# 文書リンク・検査登録の確認
python3 scripts/update.py audit
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
|`scripts/update.py`・`scripts/lib/`|更新の入口と内部処理|
|`tests/`|ゲーム・更新処理・任意描画の検査|
|`config/test-suites.json`|ローカルとCI共通の検査一覧|
|`index.html`・`GAME_SPEC.txt`・`release-manifest.json`|自動生成する公開物。直接編集しない|
|`docs/`|更新ガイド、変更履歴、資料、検証記録|

生成と同期を個別に行う場合は `python3 scripts/lib/release.py --write` ／ `--check` でも実行できます。変更に応じた検査は更新ガイドを参照してください。ブラウザ自動デバッグは行いません。

## 更新依頼時の公開同期

ユーザーの継続指示により、ChatGPTへ依頼した更新は検証後に既存公開版へ同期する。v8.75以降、通常の更新ごとに公開確認を取り直さない。GitHubへの反映だけで完了とせず、公開サイトの6ファイル一致と配布指示書の同期を確認する。下書き・未公開の指定がある場合はその指定を優先する。失敗や競合は隠さず未完了として報告する。ローカルのupdate.pyコマンド自体はコミット・公開を行わない。
