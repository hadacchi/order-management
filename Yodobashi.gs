const YodobashiParser = {
  parse: function(message) {
    const subject = message.getSubject();
    const type = this.getType(subject);
    if (type === "Ignore") return null;

    const body = message.getPlainBody();
    
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
    if (subject.includes("クレジットカード決済のご利用確認が完了")) return "Update";
    if (subject.includes("商品出荷のお知らせ")) return "Update";
    return "Ignore";
  },

  getOrderId: function(body) {
    const idMatch = body.match(/【ご注文番号】\s*(\d+)/);
    return idMatch ? idMatch[1] : "不明";
  },

  getItemNames: function(body) {
    // 1. まず商品セクションだけを切り出す
    const sectionMatch = body.match(/【ご注文商品】([\s\S]*?)【お支払方法】/);
    if (!sectionMatch) return "商品セクション取得失敗";
    
    const section = sectionMatch[1];
    // 2. 「・「商品名」」の形式をすべて抽出（改行が含まれるので [^」]+ でカギカッコ閉じまで取る）
    const itemMatches = [...section.matchAll(/・「([^」]+)」/g)];
    
    if (itemMatches.length > 0) {
      // 複数ある場合は「 / 」でつなげる。改行や余計な空白は掃除するよ！
      return itemMatches.map(m => m[1].replace(/\s+/g, "").trim()).join(" / ");
    }
    return "商品名取得失敗";
  },

  getPrice: function(body) {
    // 「今回のお買い物合計金額」の後の数字を取る（カンマを除去して数値化しやすくするよ）
    const priceMatch = body.match(/今回のお買い物合計金額\s+([0-9,]+)\s*円/);
    return priceMatch ? priceMatch[1].replace(/,/g, "") : "不明";
  },

  getDeliveryDate: function(body) {
    // メール全体から最初に出てくる「2026年02月13日」形式の日付を探す
    const dateMatch = body.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (dateMatch) {
      // 月と日を2桁に揃えて YYYY/MM/DD に変換
      const y = dateMatch[1];
      const m = ("0" + dateMatch[2]).slice(-2);
      const d = ("0" + dateMatch[3]).slice(-2);
      return `${y}/${m}/${d}`;
    }
    return "確認中";
  }
};