#!/usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var WebSocketClient = require("websocket").client;

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;
let guid = null;
let g_user;
let ak = null;
let disName;
let serverMsg;

var messageTypeNewChatAck = "newChatAcknowledgement";
var messageTypeAck = "acknowledgement";
var messageTypeError = "error";
var messageTypeNotification = "notification";

// Json method names for notification messages
var jsonMethodRequestChat = "requestChat";
var jsonMethodRequestCallBack = "callBack";
var jsonMethodRequestNewParticipant = "newParticipant";
var jsonMethodRequestisTyping = "isTyping";
var jsonMethodRequestNewMessage = "newMessage";
var jsonMethodRequestCloseConversation = "closeConversation";
var jsonMethodRequestParticipantLeave = "participantLeave";
var jsonMethodRequestNewPushMessage = "newPushPageMessage";
var jsonMethodRequestRequestTranscript = "requestTranscript";
var jsonMethodRequestQueueMetrics = "queueStatus";
var jsonMethodPing = "ping";

// run the Web On Hold messages every 3 seconds
var webOnHoldTimer = 3000;

// typingTimeouts
var typingTimeout = 10000;
var agentTypingTimeout = 3000;

// the ping timer affects how often PING messages are sent
var pingTimer = 5000;

// Some of these variables will be moved around
var participants;
var users = {};

// Write response classes - defined in the sample style.css file
var writeResponseClassResponse = "response";
var writeResponseClassSent = "sent";

// Variables for reconnection timeout.
// Try every 3 seconds for a total of 10 minutes
var totalNumberOfRetrys = 0;
var maxNumberOfRetrys = 200;
var retryInterval = 3000;
var dontRetryConnection = false;
var reconnectionTimeout;
var previouslyConnected = false;

var webOnHoldComfortGroups;
var webOnHoldURLs;

//queue Status delay timeout
var queueStatusDelayTimeout = 3500;
var webOnHoldInterval;
var queueStatusDelay;

var client = new WebSocketClient();
app.get("/api/initChat", async function (req, res) {
  // get user details from url
  let getMsg = req.query.msg;
  let getEmail = req.query.email;
  let getName = req.query.name;

  var messages = {
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

  console.log(messages);

  client.on("connectFailed", function (error) {
    console.log("Connect Error: " + error.toString());
  });
  client.on("connect", function (connection) {
    console.log("WebSocket Client Connected");
    connection.on("error", function (error) {
      console.log("Connection Error: " + error.toString());
    });
    connection.on("close", function () {
      console.log("Connection Closed");
    });
    connection.on("message", function (message) {
      if (message.type === "utf8") {
        let msg = message.utf8Data.toString();

        let parseData = JSON.parse(msg);
        let body = parseData.body;

        let method = body.method;
        if (method != "error") {
          if (method === jsonMethodRequestNewMessage) {
            notifyNewMessage(body);
          } else if (method === jsonMethodRequestChat) {
            notifyRequestChat(body);
          } else if (method === jsonMethodRequestNewParticipant) {
            notifyNewParticipant(body);
          } else if (method === jsonMethodRequestisTyping) {
            console.log("Agent is typingggg");
          } else if (method === jsonMethodRequestParticipantLeave) {
            notifyParticipantLeave(body);
          } else {
            throw new TypeError(
              "Received notification with unknown method: " + method
            );
          }
        }
      }
    });

    function notifyNewParticipant(body) {
      "use strict";

      console.log("An agent has joined the chat");
      var agents = body.participants;
      // updateUsers(agents);
      // enable the controls and clear the intervals
      clearInterval(webOnHoldInterval);
      clearTimeout(queueStatusDelay);
    }

    function notifyRequestChat(body) {
      "use strict";
      guid = body.guid;
      g_user = body.intrinsics.name;
      ak = body.authenticationKey;

      console.log("Body Guid = " + guid);
      console.log("body auth code = " + ak);
      console.log("Login request received and approved");

      if (totalNumberOfRetrys > 0) {
        resetConnectionAttempts();
      }

      // if the customer has already been connected, don't play the on hold
      // messages
      if (!previouslyConnected) {
        previouslyConnected = true;
        webOnHoldComfortGroups = body.webOnHoldComfortGroups;
        webOnHoldURLs = body.webOnHoldURLs;
        // addTimerToArray(webOnHoldComfortGroups);
        // addTimerToArray(webOnHoldURLs);
        // startOnHoldMessages();
        // queueStatusDelay = setTimeout(
        //   sendQueueStatusRequest,
        //   queueStatusDelayTimeout
        // );
      }
    }

    /**
     * Sends a queueStatusRequest upon login.
     */
    function sendQueueStatusRequest() {
      "use strict";
      var statusRequest = {
        apiVersion: 1.0,
        type: "request",
        body: {
          method: "queueStatus",
        },
      };

      sendMessageNew(statusRequest);
    }

    function sendMessageNew(outMsg) {
      "use strict";
      //   console.log(outMsg);
      // if (webSocket !== null && webSocket.readyState === WebSocket.OPEN) {
      connection.sendUTF(JSON.stringify(outMsg));
      // }
    }

    function notifyNewMessage(body) {
      "use strict";
      // parse the date first, then write the message out to the div
      var date = new Date(body.timestamp);
      console.log(
        body.displayName +
          ": " +
          body.message +
          " - Sent at " +
          date.toLocaleTimeString()
      );
    }

    function notifyParticipantLeave(body) {
      "use strict";

      console.log("Agent has left the chat");

      if (body.endChatFlag === true) {
        dontRetryConnection = true;
        // connection closed
      } else {
        // if there is only one user left (i.e. the customer),
        // play the webOnHold messages
        if (Object.keys(body.participants).length === 0) {
          console.log("Only the customer remains in the room.");
          // disableControls(true);
          // startOnHoldMessages();
          participants.textString = "";
        }
      }

      var agents = body.participants;
      // updateUsers(agents);
    }

    function sendMessage() {
      if (connection.connected) {
        let msgg = JSON.stringify(messages);
        connection.sendUTF(msgg);
        setTimeout(sendMessage, 1000);
      }
    }
    sendMessage();
  });

  let respMessage = JSON.stringify({
    Name: getName,
    Email: getEmail,
    Message: getMsg,
  });
  res.send(respMessage);

  client.connect("wss://10.13.228.3:8445/CustomerControllerWeb/chat");
});

app.get("/api/sendNewMsg", async function (req, res) {
  let getMsg = req.query.msg;

  console.log("Body Guid = " + guid);
  console.log("body auth code = " + ak);

  if (getMsg !== "") {
    var message_new = {
      apiVersion: "1.0",
      type: "request",
      body: {
        method: "newMessage",
        message: getMsg,
        guid: guid,
        authenticationKey: ak,
      },
    };
    client.on("connect", function (connection) {
      connection.on("message", function (message_new) {
        if (message_new.type === "utf8") {
          let msg = message_new.utf8Data.toString();
          let parseData = JSON.parse(msg);
          let body = parseData.body;
          let method = body.method;
        }
      });

      function sendMessage() {
        if (connection.connected) {
          let msgg = JSON.stringify(message_new);
          connection.sendUTF(msgg);
          setTimeout(sendMessage, 1000);
        }
      }
      sendMessage();
    });

    isTyping = false;
  }
  let respMessage = JSON.stringify({
    Message: getMsg,
  });
  res.send(respMessage + " New msg sent " + previouslyConnected);
});

app.listen(port);
console.log("Server started at http://localhost:" + port);
