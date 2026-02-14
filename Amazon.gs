const AmazonParser = {
  parse: function(message) {
    const subject = message.getSubject();
    const type = this.getType(subject);
    if (type === "Ignore") return null;

    const body = message.getPlainBody();
    return {
      type: type,
      shop: "Amazon",
      item: this.getItemName(subject),
      price: this.getPrice(body),
      delivery: this.getDeliveryDate(message),
      orderId: this.getOrderId(body),
      date: Utilities.formatDate(message.getDate(), "JST", "yyyy/MM/dd")
    };
  },

  getType: function(subject) { 
    // 1. 注文済み
    if (subject.startsWith("注文済み")) {
      return "Order";
    }
    
    // 2. 発送・配達中（更新系）
    if (subject.startsWith("発送済み") || subject.startsWith("配達中")) {
      return "Update";
    }
    
    // 3. 配達完了
    // 「配達済み」から始まる、または「配達しました」が含まれる場合
    if (subject.startsWith("配達済み") || subject.indexOf("配達しました") !== -1) {
      return "Completed";
    }

    // 4. それ以外（電子データやキャンセルなど）
    return "Ignore";
  },
  getItemName: function(subject) { 
    const match = subject.match(/「(.*)」/);
    // マッチすれば中身を、しなければ空文字を返す
    return (match && match[1]) ? match[1].trim() : "";
   },
  getPrice: function(body) { 
    // 1. 合計金額を抜き出す (例: ￥ 1,234)
    // 「合計」の後に、改行を含むあらゆる文字（[\s\S]*?）が続き、
    // その後に数字（[0-9]+）と JPY が来るパターン
    const priceMatch = body.match(/合計[\s\S]*?([0-9,]+)\s?JPY/);
    return priceMatch ? priceMatch[1] : "不明";
  },
  getDeliveryDate: function(message) { 
    // 2. お届け予定日を抜き出す (「○曜日にお届け」を抽出，複数のパターンを試す)
    const body = message.getPlainBody();
    const deliveryMatch = body.match(/([0-9月日\s〜からまで]+|今日|本日|明日|明後日|[一-龠]{3})(にお届け|到着予定)/);

    if (deliveryMatch) {
      const rawText = deliveryMatch[1].trim().replace(/\n/g, "");
      const resultDate = new Date(message.getDate());

      // パターン(2): 本日・明日
      if (rawText.includes("本日") || rawText.includes("今日")) {
        return Utilities.formatDate(resultDate, "JST", "yyyy/MM/dd");
      } else if (rawText.includes("明日")) {
        resultDate.setDate(resultDate.getDate() + 1);
        return Utilities.formatDate(resultDate, "JST", "yyyy/MM/dd");
      }

      // パターン(1): 曜日計算
      else if (rawText.includes("曜日")) {
        const dayMap = {"日曜日":0, "月曜日":1, "火曜日":2, "水曜日":3, "木曜日":4, "金曜日":5, "土曜日":6};
        const dayMatch = rawText.match(/[一-龠]{3}/);
        if (dayMatch) {
          const targetDay = dayMap[dayMatch[0]];
          const currentDay = resultDate.getDay();
          let diff = targetDay - currentDay;
          if (diff <= 0) diff += 7;
          resultDate.setDate(resultDate.getDate() + diff);
          return Utilities.formatDate(resultDate, "JST", "yyyy/MM/dd");
        }
      }

      // パターン(3)(4): 「○月○日」や「〜まで」が含まれる場合
      // 曜日や相対日数がヒットしなかった場合、または数字が含まれる場合はそのまま返す
      return rawText;
    }
    return "不明";
  },
  getOrderId: function(body) { 
    const orderIdMatch = body.match(/注文番号\s*([0-9]{3}-[0-9]{7}-[0-9]{7})/);
    return orderIdMatch ? orderIdMatch[1] : "不明";
  }
};
