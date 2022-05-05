process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var W3CWebSocket = require("websocket").w3cwebsocket;
var avaya_chat_url = "wss://10.13.228.3:8445/CustomerControllerWeb/chat";

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

var messages = {
  apiVersion: "1.0",
  type: "request",
  body: {
    method: "requestChat",
    guid: null,
    authenticationKey: null,
    deviceType:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36",
    requestTranscript: false,
    intrinsics: {
      email: "ksk@gm.in",
      name: "harish",
      country: "+91",
      area: "95970",
      phoneNumber: "42107",
      skillset: "WC_Default_Skillset",
      customFields: [
        {
          title: "address",
          value: "114, Achari Street, Modaiyur",
        },
      ],
    },
  },
};
app.get("/api/initChat", function (req, res) {
  var client = new W3CWebSocket(avaya_chat_url);
  client.onerror = function () {
    console.log("Connection Error");
  };
  client.onopen = function () {
    console.log("WebSocket Client Connected");

    function sendNumber() {
      if (client.readyState === client.OPEN) {
        let msg_resp = JSON.stringify(messages);
        client.send(msg_resp);
        //   setTimeout(sendNumber, 1000);
      }
    }
    sendNumber();
  };

  client.onclose = function () {
    console.log("echo-protocol Client Closed");
  };

  client.onmessage = function (e) {
    if (typeof e.data === "string") {
      console.log("Received: '" + e.data + "'");
    }
  };
  return res.json({
    success: true,
    name: "Succ",
    email: "test@gm.in",
    message: "User Started chat",
  });
});

app.listen(port);
console.log("Server started at http://localhost:" + port);
