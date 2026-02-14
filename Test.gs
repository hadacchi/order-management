const TestParser = {
  parse: function(message) {
    return {
      type: "Test",
      shop: "Trigger Monitor",
      item: message.getSubject(),
      price: 0,
      delivery: "",
      orderId: "",
      date: Utilities.formatDate(message.getDate(), "JST", "yyyy/MM/dd")
    };
  }
};