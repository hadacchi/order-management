function sendToSlack(text) {
  const url = "YOUR_WEBHOOK_URL_HERE"; // さっき作ったURLを入れてね！
  const payload = { "text": text };
  UrlFetchApp.fetch(url, {
    "method" : "post",
    "payload" : JSON.stringify(payload)
  });
}
/*
function writeToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const now = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");
  console.log(data)

  // [注文番号, 状態, 注文日, ショップ, 商品名, 金額, お届け予定, 更新日] の順で一行追加
  sheet.appendRow([data.orderId, data.type, data.date, data.shop, data.item, data.price, data.delivery, now]);
}
*/

function writeToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const now = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd HH:mm:ss");
  
  let targetRowIndex = -1;
  let note = ""; // ここにログを溜めるよ

  // 1. レコードを検索
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.orderId) {
      targetRowIndex = i + 1;
      break;
    }
  }

  // 2. 基本データ（9列分：最後が備考）
  // 注文番号, 注文日, ショップ, 商品名, 金額, お届け予定, 更新日, 状態, 備考
  let rowData = [
    data.orderId, data.date, data.shop, data.item, data.price, data.delivery, now, data.type, ""
  ];

  if (data.type === "Order") {
    if (targetRowIndex !== -1) {
      // ケース1：注文メールなのに既に番号がある（上書き）
      note = "⚠️警告：注文メール重複受領。既存レコードを上書きしました。";
      rowData[8] = note; 
      sheet.getRange(targetRowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // 正常：新規追加
      sheet.appendRow(rowData);
    }
  } else {
    // 【更新系：発送・配達中・完了】
    if (targetRowIndex !== -1) {
      // 正常：更新
      // 更新時は「注文日(2)」「ショップ(3)」「金額(5)」を壊さないように配慮してもいいけど、
      // 今回は一旦ガバッと上書きしちゃうね！
      sheet.getRange(targetRowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // ケース2：更新メールなのに元データがない（新規追加）
      note = `❌エラー：${data.type}メールを先に受信。注文データ未存在のため新規作成。`;
      rowData[8] = note;
      sheet.appendRow(rowData);
    }
  }
}

