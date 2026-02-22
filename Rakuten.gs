const RakutenParser = {
  parse: function(message) {
    const subject = message.getSubject();
    const body = message.getPlainBody();
    const msgDate = message.getDate();

    // 楽天の自動配信メール以外、または注文番号がない場合は無視
    const orderIdMatch = body.match(/\[(?:受注番号|注文番号)\]\s*([\d-]{26})/);
    if (!orderIdMatch) return null;

    return {
      type: "Order", // 自動配信メールは常に新規注文扱い
      shop: this.getShopName(body),
      item: this.getItemName(body),
      price: this.getPrice(body),
      delivery: this.getEstimatedDelivery(msgDate), // 発注日+3日の計算
      orderId: orderIdMatch[1],
      date: Utilities.formatDate(msgDate, "JST", "yyyy/MM/dd")
    };
  },

  // ショップ名の抽出
  getShopName: function(body) {
    const match = body.match(/\[ショップ名\]\s*(.*)/);
    return match ? match[1].trim() : "楽天ショップ";
  },

  // 商品名の抽出（[商品] の次の行をまるごと1行）
  getItemName: function(body) {
    const lines = body.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("[商品]")) {
        // [商品] の次の行が存在するかチェック
        if (lines[i + 1]) {
          return lines[i + 1].trim();
        }
      }
    }
    return "商品名不明";
  },

  // 支払い金額の抽出
  getPrice: function(body) {
    // 支払い金額 または お支払い金額 の後ろの数字を取得
    const match = body.match(/(?:支払い金額|お支払い金額)\s*[:：]?\s*([0-9,]+)/);
    return match ? match[1] : "不明";
  },

  // 到着予定日の計算（発注日 + 3日）
  getEstimatedDelivery: function(orderDate) {
    const deliveryDate = new Date(orderDate.getTime());
    deliveryDate.setDate(deliveryDate.getDate() + 3); // 3日後をセット
    return Utilities.formatDate(deliveryDate, "JST", "yyyy/MM/dd");
  }
};