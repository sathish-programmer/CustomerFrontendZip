process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const WebSocket = require("ws");
var socket = new WebSocket("wss://10.13.228.3:8445/CustomerControllerWeb/chat");
const express = require("express");
const app = express();
const port = process.env.PORT || 3200;

let guid = null;
let g_user;
let ak = null;

//queue Status delay timeout
var queueStatusDelayTimeout = 3500;

// Message types
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

// Some of these variables will be moved around
var participants;

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

app.get("/api/initChat", function (req, res) {
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
  //   socket.onopen = function (e) {
  //     console.log("[open] Connection established");
  //     console.log("Sending to server");
  //     let msgg = JSON.stringify(messages);
  //     socket.send(msgg);
  //   };
  socket.on("open", function () {
    console.log("Connected to server");
    console.log("[open] Connection established");
    console.log("Sending to server");
    let msgg = JSON.stringify(messages);
    socket.send(msgg);
  });

  let respMessage = JSON.stringify({
    Name: getName,
    Email: getEmail,
    Message: getMsg,
  });
  res.send(respMessage);
});

app.get("/api/sendNewMsg", async function (req, res) {
  let getMsg = req.query.msg;
  let currTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  if (getMsg !== "") {
    var message_new = {
      apiVersion: "1.0",
      type: "request",
      body: {
        method: "newMessage",
        message: getMsg,
      },
    };
    let msg_new = JSON.stringify(message_new);
    socket.send(msg_new);

    console.log("User: " + getMsg + " - Sent at " + currTime);
  }
  let respMessage = JSON.stringify({
    Message: getMsg,
  });
  res.send(respMessage + " New msg sent ");
});

// getting msg
socket.onmessage = function (event) {
  var msg = JSON.parse(event.data),
    body = msg.body,
    method = body.method;
  // Handle the message according to the type and method.
  // Notifications are in their own method to reduce complexity.
  if (msg.type === messageTypeNotification) {
    handleNotification(msg);
  } else if (msg.type === messageTypeError) {
    console.log(
      "An error occurred " + body.code + " (" + body.errorMessage + ")"
    );
  } else if (msg.type === messageTypeAck) {
    // Nothing to do for acks
  } else if (msg.type === messageTypeNewChatAck) {
    // if a newChatAcknowledgement has been received,
    // then use it to initialise the guid, webOnHold variables, etc.
    guid = body.guid;
    // enable the controls and let the user know that their request
    // has been approved
    // resetConnectionRetrys();
    console.log("Chat request approved");
  } else {
    throw new TypeError("Unknown message type:\n" + msg);
  }
  //   console.log(`[message] Data received from server: ${event.data}`);
};

function handleNotification(message) {
  // NOSONAR Reason: too complex, but cannot be reduced further
  "use strict";
  var body = message.body,
    method = body.method;

  if (method === jsonMethodRequestChat) {
    notifyRequestChat(body);
  } else if (method === jsonMethodRequestNewParticipant) {
    notifyNewParticipant(body);
  } else if (method === jsonMethodRequestisTyping) {
    console.log("Agent is typing");
  } else if (method === jsonMethodRequestNewMessage) {
    notifyNewMessage(body);
  } else if (method === jsonMethodRequestCloseConversation) {
    notifyCloseConversation(body);
  } else if (method === jsonMethodRequestParticipantLeave) {
    notifyParticipantLeave(body);
  } else if (method === jsonMethodRequestQueueMetrics) {
    notifyQueueStatus(body);
  } else if (method === jsonMethodPing) {
    // do nothing with pings. They just confirm that the websocket is open.
  } else {
    throw new TypeError("Received notification with unknown method: " + method);
  }
}

function notifyQueueStatus(body) {
  "use strict";
  var position = body.positionInQueue,
    wait = body.estimatedWaitTime;
  console.log(
    "Customer is in position " +
      position +
      " and will wait for around " +
      wait +
      " seconds"
  );
  var waitMinutes = Math.round(wait / 60);

  // if the customer's expected wait time or position in the queue is greater than 0, let them know.
  if (waitMinutes > 0 && position > 0) {
    console.log(
      "You are in position " +
        position +
        " in the queue. Estimated wait time is " +
        waitMinutes +
        " minutes"
    );
  }
}

function notifyCloseConversation(body) {
  "use strict";
  console.log("Closing the conversation? " + body.result);

  dontRetryConnection = body.result;
  if (body.result === true) {
    socket.close(1000, "Closing gracefully");
  }
}

function notifyNewParticipant(body) {
  "use strict";

  console.log("An agent has joined the chat");
  var agents = body.participants;
  clearInterval(webOnHoldInterval);
  clearTimeout(queueStatusDelay);
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

function notifyRequestChat(body) {
  "use strict";
  guid = body.guid;
  g_user = body.intrinsics.name;
  ak = body.authenticationKey;
  console.log("Login request received and approved");

  //   if (totalNumberOfRetrys > 0) {
  //     resetConnectionAttempts();
  //   }

  // if the customer has already been connected, don't play the on hold
  // messages
  if (!previouslyConnected) {
    previouslyConnected = true;
    webOnHoldComfortGroups = body.webOnHoldComfortGroups;
    webOnHoldURLs = body.webOnHoldURLs;
  }
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
      participants.textString = "";
    }
  }

  var agents = body.participants;
  // updateUsers(agents);
}

// close connection
socket.onclose = function (event) {
  if (event.wasClean) {
    console.log(
      `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
    );
  } else {
    console.log("[close] Connection died");
  }
};

socket.onerror = function (error) {
  console.log(`[error] ${error.message}`);
};

app.listen(port);
console.log("Server started at http://localhost:" + port);
