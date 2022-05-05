const test = require("./chatMessage");

bot.on("message", (msg) => {
  chatIdBot = msg.chat.id;

  let get_name = msg.from.first_name;
  let get_userName = msg.from.username;

  // replay resp
  if (msg.text) {
    let message_new = {
      apiVersion: "1.0",
      type: "request",
      body: {
        method: "newMessage",
        message: msg.text,
      },
    };
    let msg_new = JSON.stringify(message_new);
    socket.send(msg_new);

    // sending msg to users
    var hi = "hi";
    if (msg.text.toString().toLowerCase().indexOf(hi) === 0) {
      bot.sendMessage(
        msg.chat.id,
        "Welcome to the Avaya Contact Center. How can I help you?"
      );
    }

    var bye = "bye";
    if (msg.text.toString().toLowerCase().includes(bye)) {
      bot.sendMessage(msg.chat.id, "Hope to see you around again , Bye");
    }

    var help = "help";
    if (msg.text.toString().toLowerCase().includes(help)) {
      bot.sendMessage(msg.chat.id, "What type of help you need");
    }
    // console.log(`${get_name}: ${msg.text}`);
  }
});

module.exports = codeTele;
