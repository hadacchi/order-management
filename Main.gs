function main() {
  const labelMapping = [
    { label: "AutoProcess/Order/Amazon", type: "Amazon" },
    { label: "AutoProcess/Order/Test", type: "Test" },
    { label: "AutoProcess/Order/Yodobashi", type: "Yodobashi"},
    { label: "AutoProcess/Order/Rakuten", type: "Rakuten"}
    //{ label: "AutoProcess/Alert",        type: "Alert" }
  ];

  labelMapping.forEach(item => {
    // 検索結果を .reverse() で古い順に！
    const threads = GmailApp.search(`label:${item.label} is:unread`).reverse();
    
    threads.forEach(thread => {
      // スレッド内のメッセージも .reverse() で古い順に！
      const messages = thread.getMessages().reverse();

      messages.forEach(message => {
        const parser = ShopParsers[item.type];
        if (parser) {
          const data = parser(message);

          if (data) {
            // ここで古い順に writeToSheet に渡されるから、
            // 「注文」→「発送」→「完了」の順で正しく Upsert されるよ！
            writeToSheet(data);
          }
          message.markRead();
        }
      });
    });
  });
/*  labelMapping.forEach(item => {
    const threads = GmailApp.search(`label:${item.label} is:unread`);
    
    threads.forEach(thread => {
      thread.getMessages().forEach(message => {

        const parser = ShopParsers[item.type];
        if (parser) {
          const data = parser(message);

          // ここで処理を分岐！
          if (data) {
            if (item.type === "Alert") {
              //sendToSlack(`🚨【警告】${data.subject}\n${data.body}`);
            } else {
              writeToSheet(data);
              //sendToSlack(`🛒【${data.shop}】注文を確認したよ！\n商品：${data.item}\n金額：${data.price}円\n予定：${data.delivery}`);
            }
          }
          message.markRead(); // 処理済みとして既読にする
        }
      });
    });
  });*/
}