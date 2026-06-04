/**
 * 12のアニマル気質 動物キャラナビ診断
 * Google Apps Script (GAS) ウェブアプリ公開用スクリプト
 * 
 * 【デプロイ手順】
 * 1. Googleドライブで新規の「Google Apps Script」プロジェクトを作成します。
 * 2. この「gas_code.gs」のコードを、エディタの「コード.gs」に貼り付けます。
 * 3. 左上の「＋」ボタンから「HTML」ファイルを追加し、名前を「index」にします。
 * 4. 作成された「index.html」の中身をすべて消し、パソコン内の「gas_deploy.html」の中身を丸ごとコピペします。
 * 5. 画面右上の「デプロイ」＞「新しいデプロイ」をクリックします。
 * 6. 種類の選択（歯車マーク）で「ウェブアプリ」を選択します。
 * 7. アクセスできるユーザーを「全員」にして「デプロイ」をクリックします。
 * 8. 発行されたURLをThreadsのプロフィールに貼れば、世界中の人があなたのサイトで遊べます！
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('12のアニマル気質 動物キャラナビ｜あなたと推しの相性診断')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
