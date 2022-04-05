#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var WebSocketClient = require("websocket").client;

const express = require("express");
const bodyParser = require("body-parser");
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
      email: "testWebsocket@gmail.com",
      name: "test WS",
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

var client = new WebSocketClient();

client.on("connectFailed", function (error) {
  console.log("Connect Error: " + error.toString());
});

client.on("connect", function (connection) {
  console.log("WebSocket Client Connected");
  connection.on("error", function (error) {
    console.log("Connection Error: " + error.toString());
  });
  connection.on("close", function () {
    console.log("echo-protocol Connection Closed");
  });
  connection.on("message", function (message) {
    if (message.type === "utf8") {
      // console.log(JSON.stringify(messages));
      console.log("Received: '" + message.utf8Data + "'");
    }
  });

  function sendNumber() {
    if (connection.connected) {
      var number = Math.round(Math.random() * 0xffffff);
      let msgg = JSON.stringify(messages);
      connection.sendUTF(msgg);
      setTimeout(sendNumber, 1000);
    }
  }
  sendNumber();
});

client.connect("wss://10.13.228.3:8445/CustomerControllerWeb/chat");

app.get("/api/sendmessage", async function (req, res) {
  let getMsg = req.query.msg;
  res.send(`Your message is ${getMsg}`);
});

app.listen(port);
console.log("Server started at http://localhost:" + port);
