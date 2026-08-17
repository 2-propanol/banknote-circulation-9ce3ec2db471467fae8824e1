# FOLIO / World Banknote Archive データ設計

## 現在の正本

公開所蔵情報の正本は、既存サイトの data/collection.json（schemaVersion 5）です。

- Site: https://rune-markar.github.io/folio-7c4e19a2/
- Data: https://rune-markar.github.io/folio-7c4e19a2/data/collection.json
- レコードの共通キー: items[].id

FOLIOは起動時にこのJSONを読み取り、取得できない場合だけ直近のブラウザキャッシュを表示します。公開データはFOLIOから変更しません。

## 二層モデル

### 公開コレクション層

World Banknote Archiveで利用できる情報です。国・地域、通貨、額面、年、シリーズ、カタログ番号、状態、所蔵枚数、重複枚数、解説、表裏画像を含みます。

### 私有取引層

取得原価、取得目的、売価、手数料、送料、出品URL、購入元、非公開メモなどです。ブラウザ内に保存し、公開サイトへ同期しません。

両層は公開側の items[].id を共通キーとして結合します。新規登録は local-UUID の下書きとし、紙幣同定と公開可否を確認後に正式IDへ移行します。

## 将来の反転

最終的にはFOLIOを入力正本とし、公開可能フィールドだけをビルド時に抽出してWorld Banknote Archiveへ供給します。

1. FOLIO正本で個体・取得・売却を管理
2. 公開可否と画像権利を検証
3. 公開射影を collection.json として生成
4. World Banknote Archiveのauditを通す
5. 公開サイトを更新

この反転が完了するまでは、既存 collection.json が公開所蔵情報の正本です。二重更新は行いません。
