const YodobashiParser = {
  parse: function(message) {
    const subject = message.getSubject();
    const type = this.getType(subject);
    if (type === "Ignore") return null;

    const body = message.getPlainBody();

    // debug
    console.log("件名: " + message.getSubject());
    console.log(body);
  
    return {
      type: type,
      shop: "ヨドバシカメラ",
      item: this.getItemNames(body),
      price: this.getPrice(body),
      delivery: this.getDeliveryDate(body),
      orderId: this.getOrderId(body),
      date: Utilities.formatDate(message.getDate(), "JST", "yyyy/MM/dd")
    };
  },

  getType: function(subject) {
    if (subject.includes("ご注文ありがとうございます")) return "Order";
    // 決済完了は到着日を更新したいから Update 扱いにしちゃうよ！
    if (subject.includes("クレジットカード決済のご利用確認が完了")) return "Update";
    if (subject.includes("商品出荷のお知らせ")) return "Update";
    return "Ignore";
  },

  // 注文番号：【ご注文番号】 1234567890 を確実に取る
  getOrderId: function(body) {
    const idMatch = body.match(/【ご注文番号】\s*(\d+)/);
    return idMatch ? idMatch[1] : "不明";
  },

  // 商品名：改行＋「・」＋商品名を狙い撃ち
  getItemNames: function(body) {
    // ヨドバシのメール形式に合わせた抽出
    const itemMatch = body.match(/\n・(.+?)(?:\s+|$)/);
    return itemMatch ? itemMatch[1].trim() : "商品名取得失敗";
  },

  getPrice: function(body) {
    // 「合計  ￥1,234」を抽出
    const priceMatch = body.match(/合計\s+￥([0-9,]+)/);
    return priceMatch ? priceMatch[1] : "不明";
  },

  getDeliveryDate: function(body) {
    // ヨドバシ特有の「2026年2月10日 火曜日 お届け予定」みたいな形式に対応
    const dateMatch = body.match(/(\d{4}年\d{1,2}月\d{1,2}日).*?お届け予定/);
    if (dateMatch) {
      // 「2026年2月10日」を「2026/02/10」形式に変換しておくとシートが見やすいよ！
      return dateMatch[1].replace(/年|月/g, "/").replace(/日/g, "");
    }
    
    // 他のパターン「お届け予定日： 2026/02/10」
    const dateMatchAlt = body.match(/お届け予定日：\s*(\d{4}\/\d{2}\/\d{2})/);
    return dateMatchAlt ? dateMatchAlt[1] : "確認中";
  }
};