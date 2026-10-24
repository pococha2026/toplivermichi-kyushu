# トップライバーへの道：更新時の必須ルール

## 更新ごとの公開同期：2026-10-24の明示指示（最優先）

ユーザー指示：「更新時は全て公開版と自動同期」。この指示は今後の全更新に適用する。各更新依頼は、関連検証・既存GitHub mainへの反映・GitHub Pagesの配信照合・配布仕様書の同期までを含む。通常の更新ごとに公開許可を取り直さない。ユーザーが下書き・未公開を指定した作業はその指定を優先。検証失敗・競合・認証・自動承認審査の阻害は回避せず、未完了として報告する。GitHub保存と実際の公開配信を区別する。

- src/の編集元とGAME_SPEC.mdを同じ変更で更新する。index.htmlは生成物なので直接編集しない。未実装案は仕様の第27節に置き、実装済みと表示しない。
- VERSION.txtがリリース番号の正本。説明だけの変更でも最新版の配布物を生成し、同じリリースの内容を一致させる。
- python3 scripts/lib/release.py --write と --check を実行する。GAME_SPEC.txtとrelease-manifest.jsonは手編集しない。
- ゲームコードの変更には内容に応じた動作検証が必要。ハッシュ・構文確認を動作テストと呼ばない。
- アプリ、仕様、TXT、README、VERSION、manifestを同じコミットにする。並行更新を取得し、他の変更を上書きしない。
- 公開後は版情報と配布物の一致を確認する。確認できなければ公開同期未完了と報告する。
- 利用者の制作指示書TXTはGAME_SPEC.txtから同じ内容で更新する。別の文書版を先行して発行しない。更新できない場合は未完了とする。
- 恒常的に参照する最新版URLはREADMEのプレイURLと同じ階層のGAME_SPEC.txt。Libraryは更新作業時のコピーであり、外部編集から自動転送する接続はない。
- ブラウザ自動デバッグは行わない。

- ユーザーの継続指示：項目別に複数回へ分けて重点デバッグする。docs/reports/progress.jsonの未完了優先項目を引き継ぎ、再現→修正後の反復→回帰の段階と範囲を記録する。テスト件数を実機確認や全バグ解消と同一視しない。

- 編集先と検証手順はdocs/UPDATING.mdを参照。公開物は単一HTMLを維持し、srcの連結順・共有スコープを変える時は動作回帰を行う。

- 通常更新はpython3 scripts/update.py prepare --version 新版 --date YYYY-MM-DDを入口とする。check --fullはconfig/test-suites.jsonの既存全検査を実行。公開後はverify-publicで6ファイル一致を確認する。planは未コミット変更基準で、コミット済み差分の検査にはcheck --base 基準コミットを使う。

- 資料の入口はdocs/INDEX.md。update.py auditで文書リンク・検査登録を確認し、不要ファイルは参照と役割を確認してから削除する。履歴資料を現行仕様と混同しない。

- 役割別の配置はdocs/UPDATING.md、移動先はdocs/history/file-layout-8.81.jsonを参照。過去の検証JSONはdocs/reports/archive.jsonへ統合し、元データのハッシュを維持する。検査の共通入口はscripts/update.py、設定はconfig/test-suites.json。
