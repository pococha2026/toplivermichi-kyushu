# v8.74 ソース分割の確認

v8.73のcommit `d0d1a022463bdf6429b0a0eb43e780e9b1f46791` のindex.htmlと、分割後に生成したHTMLを比較。GAME_VERSIONのみRELEASEへ正規化した全文が完全一致。データ、CSS、HTML構造、実行順、共有スコープの変更なし。

版番号を除く正規化全文のSHA-256：`83a2b77d2a9bd20d6b78f7cdb554b0202f2841a23202dc1c8dc19c14108b607d`

テスト実施範囲：既存release-syncワークフロー内の各コマンドと追加ソース生成検証。実機の表示・タッチ・音は未確認。
