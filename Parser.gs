const ShopParsers = {
  "Amazon": (message) => AmazonParser.parse(message),
  "Test": (message) => TestParser.parse(message),
  "Yodobashi": (message) => YodobashiParser.parse(message),
  "Rakuten": (message) => RakutenParser.parse(message),
  "Alert": function(message) {
    // 解析せず、Slackに流すための情報を整理するだけ
    return {
      shop: "Security Alert",
      subject: message.getSubject(),
      body: message.getPlainBody().substring(0, 200) // 先頭だけ
    };
  }
};