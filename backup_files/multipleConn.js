process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const WebSocket = require("ws");
var ex = [];
ex.push(
  (function () {
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
          email: "test@gmail.com",
          name: "sathish",
          country: "+91",
          area: "",
          phoneNumber: "9087678899",
          skillset: "WC_Default_Skillset",
          customFields: [
            {
              title: "test address",
              value: "100, Test Street",
            },
          ],
        },
      },
    };
    var exampleSocket = new ReconnectingWebSocket(
      "wss://10.13.228.3:8445/CustomerControllerWeb/chat"
    );
    exampleSocket.onopen = function (event) {
      console.log("Connection Open");
      let msg_resp = JSON.stringify(messages);
      exampleSocket.send(msg_resp);
    };
    exampleSocket.onmessage = function (event) {
      console.log(event.data);
    };
    return exampleSocket;
  })()
);
