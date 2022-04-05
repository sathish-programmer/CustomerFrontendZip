process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const app = express();
const port = process.env.PORT || 3600;

app.get("/api/initChat", function (req, res) {
  var WebSocket = require("ws");
  var url = "wss://10.13.228.3:8445/CustomerControllerWeb/chat";
  var connection = new WebSocket(url);
  connection.onopen = () => {
    //...
    console.log("Connected");
  };
  connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`);
  };
  let getMsg = req.query.msg;
  let getEmail = req.query.email;
  let getName = req.query.name;
  let guid = null;
  let ak = null;
  console.log("iinnn");
  connection.onopen = function () {
    console.log("hii");
    var message_send_ini = {
      apiVersion: "1.0",
      type: "request",
      body: {
        method: "requestChat",
        guid: guid,
        authenticationKey: ak,
        deviceType:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36",
        requestTranscript: false,
        intrinsics: {
          email: getEmail,
          name: getName,
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
    let msg_resp = JSON.stringify(message_send_ini);
    connection.send(msg_resp);
  };

  //   let respMessage = JSON.stringify({
  //     Name: getName,
  //     Email: getEmail,
  //     Message: getMsg,
  //   });
  res.send("ok");
  connection.onmessage = (e) => {
    console.log(e.data);
  };
});
// connection.onmessage = (e) => {
//   console.log(e.data);
// };

app.listen(port);
console.log("Server started at http://localhost:" + port);
