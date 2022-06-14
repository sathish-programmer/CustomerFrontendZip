/**
 * @license global.js
 *
 * Copyright 2015 Avaya Inc. All Rights Reserved.
 *
 * Usage of this source is bound to the terms described in
 * licences/License.txt
 *
 * Avaya - Confidential & Proprietary. Use pursuant to your signed agreement or
 * Avaya Policy
 */

/*
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 * Holds functions and variables that are accessible across the entire site.
 * Import this before any other script, if not using a concatenated file.
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

// Maximum customers per agent
var customerSoakValue = 2;
var browserWarning =
  "Your browser does not support required features for this website. The earliest supported versions are Internet Explorer 10, Firefox 11, Chrome 31, Safari 7.1 and Opera 12.1";

// If using a popup for chat, set this to true
var usePopupForChat = false;

// the timeout for the currentqueue REST call
var queueTimeout = 60000;

// the timeout for the callback REST calls
var callbackTimeout = 60000;

// Detect browser support when ready
document.onreadystatechange = function () {
  "use strict";

  // IE 10 does not appear to recognise 'interactive' - however, IE 11,
  // Firefox and Chrome do
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    detectBrowserSupport();
    gatherElements();
  }
};

/**
 * Logs a specified message to the browser console, if it has been defined for a
 * particular browser.
 * @param messageToLog
 */
function logToConsole(messageToLog) {
  "use strict";
  if (console !== undefined) {
    console.log(messageToLog);
  }
}

/**
 * Returns a specific element
 * @param el
 * @returns the element with the specific Id
 */
function getEl(el) {
  "use strict";
  return document.getElementById(el);
}

/**
 * Checks if the user's browser supports the required features. For the chat to
 * work, the browser <b>MUST</b> support JSON parsing, WebSockets and
 * XMLHttpRequests. If it does not support any of these, alert the user.
 */
function detectBrowserSupport() {
  "use strict";
  if (!WebSocket || !XMLHttpRequest || !JSON) {
    window.alert(browserWarning);
  }
}

/**
 * Adds the specified key-value pair to sessionStorage.
 * @param key
 * @param value
 */
function setSessionStorage(key, value) {
  "use strict";
  sessionStorage.setItem(key, value);
}

/**
 * Get the specified item from sessionStorage
 * @param key
 * @returns
 */
function getSessionStorage(key) {
  "use strict";
  return sessionStorage.getItem(key);
}

/**
 * Gathers all elements on page load.
 */
function gatherElements() {
  "use strict";
  logToConsole("Gathering elements");
  sendButton = getEl("sendbutton-chat");
  callbackRequestButton = getEl("callbackPanel");
  closeButton = getEl("closebutton-chat");
  messages = getEl("messages");
  outMessage = getEl("outmessage");
  participants = getEl("participants");
  pagePushDiv = getEl("pagePushDiv");
}

/**
 * Clear the user details from session storage.
 */
function clearSessionStorage() {
  "use strict";
  setSessionStorage("user", "");
  setSessionStorage("phone", "");
  setSessionStorage("email", "");
  setSessionStorage("account", "");
  setSessionStorage("skillset", "");
  setSessionStorage("subject", "");
}

/**
 * webChatConfig.js
 *
 * Copyright 2015 Avaya Inc. All Rights Reserved.
 *
 * Usage of this source is bound to the terms described in
 * licences/License.txt
 *
 * Avaya - Confidential & Proprietary. Use pursuant to your signed agreement or
 * Avaya Policy
 */

/*
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 *
 * This section configures the Web Chat.
 *
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

var webSocket;

// Variables for reconnection timeout.
// Try every 3 seconds for a total of 10 minutes
var totalNumberOfRetrys = 0;
var maxNumberOfRetrys = 200;
var retryInterval = 3000;
var dontRetryConnection = false;
var reconnectionTimeout;
var previouslyConnected = false;

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

// Images for the users panel
var agentImage = "images/agent.png";
var agentTypingImage = "images/agent_typing.png";
var supervisorImage = "images/supervisor.png";
var supervisorTypingImage = "images/supervisor_typing.png";

/**
 * webChat.js
 *
 * Copyright 2015 Avaya Inc. All Rights Reserved.
 *
 * Usage of this source is bound to the terms described in
 * licences/License.txt
 *
 * Avaya - Confidential & Proprietary. Use pursuant to your signed agreement or
 * Avaya Policy
 */

/*
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 * This section defines the client end of the WebSocket chat.
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

// particular elements with particular names
// These rely on elements in the page, or need to be defined first
var sendButton;
var callbackRequestButton;
var closeButton;
var messages;
var outMessage;
var guid = null;
var webOnHoldComfortGroups;
var webOnHoldURLs;

// the authentication key
var ak = null;

// run the WebOnHold check every 3 seconds
var webOnHoldInterval;

// PING messages are sent at regular intervals
var pingInterval;

// these handle the isTyping notifications. By default, allows
// a 10 second gap between keypresses
var isTyping = false;
var typeOut;
var activeAgentTypeOut;
var passiveAgentTypeOut;
var supervisorTypeOut;
var usersTable;

// the queue status check is sent at a delay
var queueStatusDelay;

// the following variables require getSessionStorage,
// but are initialised on chat begin
var g_email, g_user, g_skillset, g_account, g_phone, g_country, g_subject;

var initCalled = false;

// should page pushes from agent open automatically?
var autoOpen = false;

// an array of timeouts to clear
var timeouts = [];

var pagePushDiv;

/**
 * Toggles the controls. Ignores the close button so the user can leave a chat
 * at any time.
 * @param isDisabled is true if controls are disabled
 */
function disableControls(isDisabled) {
  "use strict";

  logToConsole("Disabling controls: " + isDisabled);
  sendButton.disabled = isDisabled;
  outMessage.disabled = isDisabled;

  if (isDisabled === false) {
    pagePushDiv.style.display = "block";
    outMessage.addEventListener("keydown", onType);
  } else {
    pagePushDiv.style.display = "none";
    outMessage.removeEventListener("keydown", onType);
  }
}

/**
 * Called when the customer types
 * @param e
 */
function onType(e) {
  "use strict";
  if (e.keyCode === 13) {
    sendChatMessage();
  } else {
    startTypingTimer();
  }
}

/**
 * Creates a new paragraph with a specific class, adds the specified text to it,
 * and then appends it to the messages div. Also includes an autoscroll
 * mechanism.
 * @param text
 * @param msgClass defined inside the CSS file
 */
function writeResponse(text, msgClass) {
  "use strict";
  var paragraph = document.createElement("p");
  paragraph.className = msgClass;
  paragraph.textContent = text;
  messages.appendChild(paragraph);
  // Scroll to bottom of the messages div to show new messages
  messages.scrollTop = messages.scrollHeight;
}

/**
 * Updates the users section.
 */
function updateUsers(agents) {
  "use strict";

  users = {};

  // hide the children immediately, and then reshow those
  for (var x = 0; x < participants.children.length; x++) {
    var child = participants.children[x],
      image = child.getElementsByTagName("img")[0];
    child.className = "hidden";
    image.className = "hidden";
    image.src = "";
    // clear the TextNode after this - i.e. removes the text after the image
    image.nextSibling.textContent = "";
  }

  if (agents !== undefined) {
    for (var i = 0; i < agents.length; i++) {
      var agent = agents[i];
      logToConsole(
        "Adding agent with id " + agent.id + " and name " + agent.name
      );

      var div = participants.children[i];
      div.className = "user";
      // find the first image in the div
      var typingImage = div.getElementsByTagName("img")[0];
      typingImage.src =
        agent.type === "supervisor" ? supervisorImage : agentImage;
      typingImage.className = "";

      // should be the first TextNode in the div after the image
      // which enters it into the div just after the image
      typingImage.nextSibling.textContent = agent.name;

      users[agent.id] = {
        name: agent.name,
        isTyping: false,
        agentType: agent.type,
        image: typingImage,
      };
    }
  }
}

/**
 * Adds a timer to the specified array.
 * @param array
 */
function addTimerToArray(array) {
  "use strict";
  if (array === undefined) {
    return;
  }

  for (var p = 0; p < array.length; p++) {
    var obj = array[p];
    obj.lastCalled = new Date().valueOf();
    obj.currentSequence = 0;
  }
}

/**
 * Plays the WebOnHold messages.
 * @param array
 */
function playOnHoldMessages(array) {
  "use strict";
  var currentDate = new Date(),
    currentTime = currentDate.valueOf();
  for (var i = 0; i < array.length; i++) {
    var group = array[i];
    var deltaTime = (currentTime - group.lastCalled) / 1000;
    if (deltaTime >= group.delay || deltaTime >= group.holdTime) {
      var currentMsg;

      // if this has a urls array, it's a WebOnHold URL
      // otherwise, it's a comfort message
      if (group.urls !== undefined) {
        currentMsg = group.urls[group.currentSequence];

        writeResponse("Please visit this link: ", writeResponseClassResponse);
        appendLink(currentMsg.url, "_blank", false);
      } else {
        currentMsg = group.messages[group.currentSequence];
        writeResponse(currentMsg.message, writeResponseClassResponse);
      }
      group.lastCalled = currentTime;
      group.currentSequence++;
      if (
        (group.numberOfMessages !== undefined &&
          group.currentSequence >= group.numberOfMessages) ||
        (group.urls !== undefined && group.currentSequence >= group.urls.length)
      ) {
        group.currentSequence = 0;
      }
    }
  }
}

/**
 * Append a link to the transcript box.
 * @param url
 * @param urlDestination destination for the URL
 * @param openAutomatically if true, should open automatically
 */
function appendLink(url, urlDestination, openAutomatically) {
  "use strict";

  var p = document.createElement("p");
  var link = document.createElement("a");
  link.href = url;
  link.text = url;
  link.target = "_" + urlDestination;
  p.appendChild(link);
  messages.appendChild(link);

  // Scroll to bottom of the messages div to show new messages
  messages.scrollTop = messages.scrollHeight;

  if (openAutomatically) {
    window.open(link);
  }
}

/**
 * Logs the user into the chat.
 * @param user
 * @param email
 * @param account
 * @param phone
 */
function chatLogin(user, email, account, skillset, phone) {
  "use strict";
  var wantsEmail = getEl("transcript-chat").checked;
  var custAddress = getEl("address-chat");

  // if the user didn't specify a valid email address, they can't receive a transcript.
  if (isStringEmpty(email)) {
    wantsEmail = false;
  }

  logToConsole(
    "country is " +
      phone.country +
      ", area is " +
      phone.area +
      ", phone is " +
      phone.phone
  );
  var msg = {
    apiVersion: "1.0",
    type: "request",
    body: {
      method: "requestChat",
      guid: guid,
      authenticationKey: ak,
      deviceType: navigator.userAgent,
      requestTranscript: wantsEmail,
      intrinsics: {
        email: email,
        name: user,
        country: phone.country,
        area: phone.area,
        phoneNumber: phone.phone,
        skillset: g_skillset,
        customFields: [
          {
            title: "address",
            value: custAddress.value,
          },
        ],
      },
    },
  };
  console.log(msg);
  debugger;
  writeResponse("Sending Login Details", writeResponseClassSent);
  sendMessage(msg);
}

/**
 * Sends the chatMessage.
 */
function sendChatMessage() {
  "use strict";
  var text = outMessage.value;

  if (text !== "") {
    writeResponse(g_user + ": " + text, writeResponseClassSent);
    var message = {
      apiVersion: "1.0",
      type: "request",
      body: {
        method: "newMessage",
        message: text,
      },
    };
    sendMessage(message);
    outMessage.value = "";

    // set isTyping to false
    isTyping = false;
  }
}

/**
 * Sends a close conversation request to the server.
 */
function quitChat() {
  "use strict";
  if (webSocket !== null && webSocket.readyState === webSocket.OPEN) {
    var closeRequest = {
      apiVersion: "1.0",
      type: "request",
      body: {
        method: "closeConversation",
      },
    };
    writeResponse("Close request sent", writeResponseClassSent);
    sendMessage(closeRequest);
  }
}

/**
 * Sends an IsTyping message to the server
 * @param isUserTyping
 */
function sendIsTyping(isUserTyping) {
  "use strict";
  var isTypingMessage = {
    apiVersion: "1.0",
    type: "request",
    body: {
      method: "isTyping",
      isTyping: isUserTyping,
    },
  };
  sendMessage(isTypingMessage);
}

/**
 * Sends a page push request to the agent. Remove if not required.
 */
function sendPagePushRequest() {
  "use strict";

  // get the URL, and then trim whitespace from it
  var url = getEl("urlInput").value.trim();

  if (url === "") {
    writeResponse("Please enter a link to send it", writeResponseClassResponse);
    return;
  }

  var ppr = {
    apiVersion: "1.0",
    type: "request",
    body: {
      method: "newPushPageMessage",
      pagePushURL: url,
      pagePushDestination: "newTab",
    },
  };

  writeResponse("Your link has been sent", writeResponseClassSent);
  getEl("urlInput").value = "";
  sendMessage(ppr);
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

  sendMessage(statusRequest);
}

/**
 * When a message of type requestChat comes in, use it to initialise some
 * variables and the queue status check.
 * @param body
 */
function notifyRequestChat(body) {
  "use strict";

  logToConsole(body);
  guid = body.guid;
  g_user = body.intrinsics.name;
  ak = body.authenticationKey;
  writeResponse(
    "Login request received and approved",
    writeResponseClassResponse
  );

  if (totalNumberOfRetrys > 0) {
    resetConnectionAttempts();
  }

  // if the customer has already been connected, don't play the on hold
  // messages
  if (!previouslyConnected) {
    previouslyConnected = true;
    webOnHoldComfortGroups = body.webOnHoldComfortGroups;
    webOnHoldURLs = body.webOnHoldURLs;
    addTimerToArray(webOnHoldComfortGroups);
    addTimerToArray(webOnHoldURLs);
    startOnHoldMessages();
    queueStatusDelay = setTimeout(
      sendQueueStatusRequest,
      queueStatusDelayTimeout
    );
  }
}

/**
 * Notifies the user of the new participant.
 * @param body of the message
 */
function notifyNewParticipant(body) {
  "use strict";

  writeResponse("An agent has joined the chat", writeResponseClassResponse);
  var agents = body.participants;
  updateUsers(agents);

  // enable the controls and clear the intervals
  clearInterval(webOnHoldInterval);
  clearTimeout(queueStatusDelay);
  disableControls(false);
}

/**
 * Notifies the user that another user is typing.
 * @param body of the message
 */
function notifyIsTyping(body) {
  "use strict";
  var isAgentTyping = body.isTyping;

  if (isAgentTyping === true) {
    var agent = users[body.agentId];
    agent.isTyping = isAgentTyping;
    updateTypingCell(agent, true);

    var agentTypeOut;
    if (agent.type === "active_participant") {
      agentTypeOut = activeAgentTypeOut;
    } else if (agent.type === "passive_participant") {
      agentTypeOut = passiveAgentTypeOut;
    } else {
      agentTypeOut = supervisorTypeOut;
    }

    if (agentTypeOut !== undefined) {
      clearTypingTimer(agentTypeOut);
    }

    agentTypeOut = setTimeout(function () {
      if (users !== undefined) {
        agent.isTyping = false;
        updateTypingCell(agent, false);
      }
    }, agentTypingTimeout);
    timeouts.push(agentTypeOut);
  }
}

/**
 * Updates the typing icon for a specific agent.
 * @param agent
 * @param isTyping
 */
function updateTypingCell(agent, isTyping) {
  "use strict";
  var image = agent.image;

  if (
    agent.agentType === "active_participant" ||
    agent.agentType === "passive_participant"
  ) {
    image.src = isTyping === true ? agentTypingImage : agentImage;
  } else {
    image.src = isTyping === true ? supervisorTypingImage : supervisorImage;
  }

  image.nextSibling.textContent =
    isTyping === true ? agent.name.concat(" is typing") : agent.name;
}

/**
 * Notifies the user that an actual message has arrived.
 * @param body of the message
 */
function notifyNewMessage(body) {
  "use strict";
  // parse the date first, then write the message out to the div
  var date = new Date(body.timestamp);
  writeResponse(
    body.displayName +
      ": " +
      body.message +
      " - Sent at " +
      date.toLocaleTimeString(),
    writeResponseClassResponse
  );
}

/**
 * Notifies the user of the status of a close request. Mainly used when the
 * customer decides to leave.
 * @param body of the message
 */
function notifyCloseConversation(body) {
  "use strict";
  logToConsole("Closing the conversation? " + body.result);

  dontRetryConnection = body.result;
  if (body.result === true) {
    webSocket.close(1000, "Closing gracefully");

    // clear the user's details from session storage
    clearSessionStorage();
  }
}

/**
 * Notifies the user that another user has left the chat. If the endChatFlag
 * variable of the message is set to true, close the webSocket.
 * @param body of the message
 */
function notifyParticipantLeave(body) {
  "use strict";

  writeResponse("Agent has left the chat", writeResponseClassResponse);

  if (body.endChatFlag === true) {
    dontRetryConnection = true;
    webSocket.close(1000, "Closing conversation");
  } else {
    // if there is only one user left (i.e. the customer),
    // play the webOnHold messages
    if (Object.keys(body.participants).length === 0) {
      logToConsole("Only the customer remains in the room.");
      disableControls(true);
      startOnHoldMessages();
      participants.textString = "";
    }
  }

  var agents = body.participants;
  updateUsers(agents);
}

/**
 * Notifies the user of a new page being pushed.
 * @param body of the message
 */
function notifyNewPagePushMessage(body) {
  "use strict";
  var sentDate = new Date(body.timestamp),
    url = body.pagePushURL,
    destination = body.pagePushDestination;
  writeResponse(
    body.displayName +
      " pushed the following URL at " +
      sentDate.toLocaleTimeString() +
      ":",
    writeResponseClassResponse
  );

  appendLink(url, destination, autoOpen);
}

/**
 * Notifies the user of the current queue status.
 * @param body
 */
function notifyQueueStatus(body) {
  "use strict";
  var position = body.positionInQueue,
    wait = body.estimatedWaitTime;
  logToConsole(
    "Customer is in position " +
      position +
      " and will wait for around " +
      wait +
      " seconds"
  );
  var waitMinutes = Math.round(wait / 60);

  // if the customer's expected wait time or position in the queue is greater than 0, let them know.
  if (waitMinutes > 0 && position > 0) {
    writeResponse(
      "You are in position " +
        position +
        " in the queue. Estimated wait time is " +
        waitMinutes +
        " minutes",
      writeResponseClassResponse
    );
  }
}

/**
 * Handles notification messages to reduce complexity of handleMessage. This in
 * turn is broken into subfunctions to further reduce it.
 * @param message
 */
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
    notifyIsTyping(body);
  } else if (method === jsonMethodRequestNewMessage) {
    notifyNewMessage(body);
  } else if (method === jsonMethodRequestCloseConversation) {
    notifyCloseConversation(body);
  } else if (method === jsonMethodRequestParticipantLeave) {
    notifyParticipantLeave(body);
  } else if (method === jsonMethodRequestNewPushMessage) {
    notifyNewPagePushMessage(body);
  } else if (method === jsonMethodRequestQueueMetrics) {
    notifyQueueStatus(body);
  } else if (method === jsonMethodPing) {
    // do nothing with pings. They just confirm that the websocket is open.
  } else {
    throw new TypeError("Received notification with unknown method: " + method);
  }
}

/**
 * Opens the chat.
 */
function openChat() {
  "use strict";
  initChat();
}

/**
 * Performs the actual initialisation.
 */
function initChat() {
  "use strict";

  // if the chat has already opened, don't bother opening it
  if (initCalled) {
    return;
  }

  g_user = getSessionStorage("user");
  g_email = getSessionStorage("email");
  g_skillset = getSessionStorage("skillset");
  g_account = getSessionStorage("account");
  g_phone = JSON.parse(getSessionStorage("phone"));
  g_country = getSessionStorage("country");
  g_subject = getSessionStorage("subject");
  logToConsole("Subject is " + g_subject);

  // this is sometimes undefined at this point.
  if (outMessage === undefined) {
    outMessage = getEl("outmessage");
  }

  disableControls(true);
  openSocket();
  initCalled = true;
}

/**
 * Start playing the Web on hold messages.
 */
function startOnHoldMessages() {
  "use strict";

  logToConsole("Starting the On Hold messages");
  webOnHoldInterval = setInterval(function () {
    if (webOnHoldURLs !== undefined) {
      playOnHoldMessages(webOnHoldURLs);
    } else {
      logToConsole("On Hold URLS not defined");
    }

    if (webOnHoldComfortGroups !== undefined) {
      playOnHoldMessages(webOnHoldComfortGroups);
    } else {
      logToConsole("On Hold Messages not defined");
    }
  }, webOnHoldTimer);

  timeouts.push(webOnHoldInterval);
}

/**
 * Clear the keypress timer.
 * @param obj
 */
function clearTypingTimer(obj) {
  "use strict";
  if (obj) {
    clearTimeout(obj);
  }
}

/**
 * Start the keypress timer.
 * @param obj
 */
function startTypingTimer() {
  "use strict";
  clearTypingTimer(typeOut);

  if (isTyping === false) {
    isTyping = true;
    sendIsTyping(isTyping);
  }

  typeOut = setTimeout(function () {
    isTyping = false;
  }, typingTimeout);
  timeouts.push(typeOut);
}

/**
 * Clear all timeouts in the array.
 * @param timeouts
 */
function clearAllTimeouts() {
  "use strict";

  for (var i = 0; i < timeouts.length; i++) {
    clearTimeout(timeouts[i]);
  }
}

/**
 * Sends a PING message to check the server. There is no API in JavaScript to do
 * this, so this is a workaround. Send this every 10 seconds or so.
 */
function sendPing() {
  "use strict";

  var ping = {
    apiVersion: "1.0",
    type: "request",
    body: {
      method: "ping",
    },
  };

  webSocket.send(JSON.stringify(ping));
}

/**
 * webChatSocket.js
 *
 * Copyright 2015 Avaya Inc. All Rights Reserved.
 *
 * Usage of this source is bound to the terms described in
 * licences/License.txt
 *
 * Avaya - Confidential & Proprietary. Use pursuant to your signed agreement or
 * Avaya Policy
 */

/*
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 *
 * The following section defines the WebSocket and it's interactions
 *
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

/**
 * Opens the WebSocket.
 */
function openSocket() {
  "use strict";
  participants = getEl("participants");
  logToConsole("Opening the WebSocket");

  // Ensures only one connection is open at a time
  if (webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED) {
    logToConsole("WebSocket is already opened");
    return;
  }

  clearTimeout(reconnectionTimeout);

  // Create a new instance of the WebSocket using the specified url
  webSocket = new WebSocket(webChatUrl);
  console.log(webChatUrl);

  // Binds functions to the listeners for the websocket.
  webSocket.onopen = handleOpen;
  webSocket.onmessage = handleMessage;

  webSocket.onclose = function (event) {
    // disable the controls upon close
    disableControls(true);

    // If it is an expected/graceful close, do not attempt to reconnect.
    if (event.code === 1000 || dontRetryConnection) {
      handleClose(event);
    } else {
      reconnect();
    }
  };
  webSocket.onerror = handleError;
}

/**
 * Opens the WebSocket.
 * @param event
 */
function handleOpen(event) {
  "use strict";

  // if there are agents in the chat, enable the controls
  if (Object.keys(users).length <= 0) {
    logToConsole("No users in room, disabling controls");
    disableControls(true);
  } else {
    logToConsole("Agents already in chat, enabling controls");
    disableControls(false);
  }

  pingInterval = setInterval(function () {
    sendPing();
  }, pingTimer);
  timeouts.push(pingInterval);

  chatLogin(g_user, g_email, g_account, g_skillset, g_phone);
  //   debugger;
}

/**
 * Handles incoming messages. The message is parsed as a JSON object, and then
 * handled according to the message type.
 * @param event
 */
function handleMessage(event) {
  "use strict";
  var msg = JSON.parse(event.data),
    body = msg.body,
    method = body.method;

  // Handle the message according to the type and method.
  // Notifications are in their own method to reduce complexity.
  if (msg.type === messageTypeNotification) {
    handleNotification(msg);
  } else if (msg.type === messageTypeError) {
    writeResponse(
      "An error occurred " + body.code + " (" + body.errorMessage + ")",
      writeResponseClassResponse
    );
  } else if (msg.type === messageTypeAck) {
    // Nothing to do for acks
  } else if (msg.type === messageTypeNewChatAck) {
    // if a newChatAcknowledgement has been received,
    // then use it to initialise the guid, webOnHold variables, etc.
    guid = body.guid;
    // enable the controls and let the user know that their request
    // has been approved
    disableControls(false);
    resetConnectionRetrys();
    writeResponse("Chat request approved", writeResponseClassResponse);
  } else {
    throw new TypeError("Unknown message type:\n" + msg);
  }
}
/**
 * Upon closing, inform the user and disable the controls.
 * @param event
 */
function handleClose() {
  "use strict";
  logToConsole("Definitely closing the WebSocket.");
  writeResponse("Connection closed", writeResponseClassResponse);
  disableControls(true);
  outMessage.textContent = "";
  clearAllTimeouts();

  updateUsers();
}

/**
 * Handles errors by printing them to the browser console and alerting the user.
 * @param event
 */
function handleError(event) {
  "use strict";
  logToConsole(event);
  writeResponse("A connection error has occurred", writeResponseClassResponse);
}

/**
 * Upon disconnection, this will attempt to reconnect to a WebSocket every
 * @param retryInterval
 * @param totalNumberOfRetrys
 */
function reconnect() {
  "use strict";
  if (webSocket.readyState !== webSocket.OPEN) {
    reconnectionTimeout = setTimeout(function () {
      if (totalNumberOfRetrys <= maxNumberOfRetrys) {
        logToConsole(
          "Connection failed. Reconnecting (attempt " +
            totalNumberOfRetrys +
            " of " +
            maxNumberOfRetrys +
            ")"
        );
        openSocket();

        if (!dontRetryConnection) {
          clearTimeout(reconnectionTimeout);
          totalNumberOfRetrys++;
          reconnect();
        }
      } else {
        dontRetryConnection = true;
        writeResponse("Connection failed", writeResponseClassResponse);
      }
    }, retryInterval);
  }
}

/**
 * Called after a successful connection to reset the counter for number of
 * socketConnection retries
 */
function resetConnectionAttempts() {
  "use strict";
  totalNumberOfRetrys = 0;
  dontRetryConnection = false;
  clearTimeout(reconnectionTimeout);
}

/**
 * Stringifies a JSON object and sends it over the WebSocket.
 * @param outMsg
 */
function sendMessage(outMsg) {
  "use strict";
  //   console.log(outMsg);
  if (webSocket !== null && webSocket.readyState === WebSocket.OPEN) {
    webSocket.send(JSON.stringify(outMsg));
  }
}

/**
 * webcheckQueue.js
 *
 * Copyright 2015 Avaya Inc. All Rights Reserved.
 *
 * Usage of this source is bound to the terms described in
 * licences/License.txt
 *
 * Avaya - Confidential & Proprietary. Use pursuant to your signed agreement or
 * Avaya Policy
 */

/*
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 *
 * This section performs a REST call to check the status of a queue
 * on the main pages.
 *
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

var pageSkillset;

/**
 * Checks if a particular string is empty
 * @param str
 * @returns {Boolean}
 */
function isStringEmpty(str) {
  "use strict";
  return str.length === 0;
}

/**
 * Creates a JSON message for a particular skillset value.
 * @param value for the skillset
 * @returns msg as a JSON string
 */
function createJson(value) {
  "use strict";
  var msg = {
    skillset: value,
  };
  return JSON.stringify(msg);
}

/**
 * Receives a JSON object from the server which contains the queue status.
 * @param data from the server
 * @param button or elemen that enables the chat window
 */
function receiveQueueStatus(data, button) {
  "use strict";
  var msg = JSON.parse(data),
    metrics = msg.body.metrics;
  var queueAvailable = false;
  // If the customer is asking for any skillset, check that at least one queue
  // is available. Otherwise, check if the specific queue is available
  if (isStringEmpty(pageSkillset)) {
    queueAvailable = checkAllSkillsets(metrics);
  } else {
    queueAvailable = checkSkillset(metrics);
  }

  toggleChatButton(queueAvailable, button, metrics);
}

/**
 * Checks that a specific queue is available.
 * @param queueMetrics
 * @returns {Boolean}
 */
function checkSkillset(queueMetrics) {
  "use strict";
  logToConsole("Asked specifically for " + pageSkillset);
  queueMetrics = removeFullQueues(queueMetrics);

  if (queueMetrics.length > 0) {
    setSkillsets(queueMetrics);
    return true;
  }
  return false;
}

/**
 * Checks that at least one queue is available.
 * @param queueMetrics
 * @returns {Boolean}
 */
function checkAllSkillsets(queueMetrics) {
  "use strict";
  queueMetrics = removeFullQueues(queueMetrics);
  if (queueMetrics.length > 0) {
    setSkillsets(queueMetrics);
    return true;
  }
  return false;
}

/**
 * Filters out full queues
 * @param metrics
 * @returns the filtered and sorted queue
 */
function removeFullQueues(metrics) {
  "use strict";

  return metrics.filter(function (queue) {
    return (
      queue.customersInQueue <=
        queue.availableAgentsInQueue * customerSoakValue &&
      queue.customersInQueue <= queue.maxConcurrentChats &&
      queue.availableAgentsInQueue > 0
    );
  });
}

/**
 * Toggles the chat button if there is a queue available.
 * @param isQueueAvailable
 */
function toggleChatButton(isQueueAvailable, chatButton, metrics) {
  "use strict";
  if (isQueueAvailable === true) {
    chatButton.removeAttribute("hidden");
    chatButton.style.visibility = "visible";
  }
}

/**
 * Toggles the chat button depending on the availability of a particular
 * skillset
 * @param skillset
 */
function startQueueCheck() {
  "use strict";

  // if XMLHttpRequest and WebSocket are supported by the browser,
  // perform the queue check. Otherwise, don't bother.
  if (XMLHttpRequest && WebSocket) {
    var chatButton = getEl("chatPanel"),
      server = new XMLHttpRequest({
        mozSystem: true,
        timeout: queueTimeout,
      });
    pageSkillset = getEl("pageSkillSet").value;
    chatButton.setAttribute("hidden", "hidden");
    chatButton.style.visibility = "hidden";

    // Creates an event listener for the request using the
    // requestQueueStatus function
    server.onreadystatechange = function () {
      if (server.readyState === 4 && server.status === 200) {
        receiveQueueStatus(server.response, chatButton);
      }
    };

    server.ontimeout = function () {
      logToConsole("Could not connect to the backend");
    };

    // by default, XMLHttpRequests are asynchronous, and therefore require
    // an event listener
    server.open("POST", restUrl);
    server.setRequestHeader("Content-Type", "application/json");
    server.send(createJson(pageSkillset));
  }
}

/**
 * Opens the webChatLogon page in a separate window.
 */
function createLogonWindow() {
  "use strict";
  var link = "webChatLogon.html";
  window.open(link, "Web Chat Logon", "width=400,height=500,resizable=yes");
}

/**
 * webChatLogon.js
 *
 * Copyright 2015 Avaya Inc. All Rights Reserved.
 *
 * Usage of this source is bound to the terms described in
 * licences/License.txt
 *
 * Avaya - Confidential & Proprietary. Use pursuant to your signed agreement or
 * Avaya Policy
 */

/*
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 *
 * This section defines the functionality for the logon window
 *
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

/**
 * Parses an email to check that it is valid. Only checks if there is an '@' and
 * a dot after the '@', but that will cover the vast majority of all email
 * addresses
 * @param emailToParse
 * @returns {Boolean}
 */
function parseEmail(emailToParse) {
  "use strict";
  // this regex allows any alphanumeric character
  var re = /[\w\.]+@\w+\.\w+/;
  return re.test(emailToParse);
}

/**
 * Logs a user with specific details into the chat.
 * @param name
 * @param phone
 * @param email
 * @param skillset
 */
function logon(name, phone, email, skillset) {
  "use strict";
  // if the email address is empty or otherwise invalid, alert the user.
  // if they accept this, then continue
  var confirm = true;
  var isValid = parseEmail(email);
  if (isValid === false) {
    confirm = window.confirm(
      "You may use the chat without a valid email, but you will not be able to receive transcripts of the conversation"
    );
  }

  if (confirm === true) {
    // if the customer's email was invalid, and they went ahead,
    // reset it
    if (isValid === false) {
      logToConsole("Email was invalid, resetting");
      email = "";
      setSessionStorage("email", email);
    }

    if (usePopupForChat) {
      window.open("WebChat.html", "_self");
      //   alert("false");
    } else {
      //   alert("true thh");
      switchFormToChat();
      openChat();
    }
  }
}

/**
 * Switches the form to logon mode
 */
function switchFormToLogon() {
  "use strict";
  getEl("chatForm").style.display = "block";
  getEl("chatInterface").style.display = "none";
  getEl("chatPanel").style.height = "183px";
}

/**
 * Switches the form to chat mode
 */
function switchFormToChat() {
  "use strict";
  getEl("chatForm").style.display = "none";
  getEl("chatInterface").style.display = "block";
  getEl("chatPanel").style.height = "363px";
}

/**
 * Set the skillsets according to the queue information.
 */
function setSkillsets(queues) {
  "use strict";
  var skillsetSelect = getEl("skillset-chat");

  // add the country codes to the phone callback
  var chatCountry = getEl("country-chat");
  addCountryCodes(chatCountry);

  // if a queue has space, show it as being available
  for (var l = 0; l < queues.length; l++) {
    var theQueue = queues[l];
    logToConsole("Adding " + theQueue.queueName + " to the logon page");
    var newOption = document.createElement("option");
    newOption.value = theQueue.queueName;
    newOption.text = theQueue.queueName;
    skillsetSelect.appendChild(newOption);
  }
}

/**
 * Gathers the users details and adds them to sessionStorage.
 */
function gatherDetails() {
  "use strict";
  var l_user = getEl("user-chat").value,
    l_country = getEl("country-chat").value,
    l_email = getEl("email-chat").value,
    l_skillset = getEl("skillset-chat").value;

  // store the phone details in a JSON object for convenience
  var l_phone = {
    country: "+91",
    area: "",
    phone: "0099887765",
  };

  setSessionStorage("user", l_user);
  setSessionStorage("phone", JSON.stringify(l_phone));
  setSessionStorage("country", l_country);
  setSessionStorage("email", l_email);
  setSessionStorage("skillset", l_skillset);
  logon(l_user, l_phone, l_email, l_skillset);
}
/**
 * callback.js
 *
 * Copyright 2015 Avaya Inc. All Rights Reserved.
 *
 * Usage of this source is bound to the terms described in
 * licences/License.txt
 *
 * Avaya - Confidential & Proprietary. Use pursuant to your signed agreement or
 * Avaya Policy
 */

/*
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 * This section handles callback requests and does not rely on WebSockets.
 * Instead, it sends a JSON object to the backend, which handles the grunt work.
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

var callbackDay;
var callbackMonth;
var callbackHour;
var callbackMinute;

var callbackButton;
var callbackTime;
var callbackDate;

var callbackEmail;
var callbackPhone;
var callbackCountry;
var callbackArea;
var callbackName;
var callbackSkillset;

var countryCode = "";
var areaCode = "";
var email = "";
var custName = "";
var phone;
var skillset;

var theDate;

// store the user details in a JSON object for convenience
var user = {};

/**
 * Hides the callback date form.
 */
function hideCallbackDateForm() {
  "use strict";

  // call jQuery and tell it to slide the div in if it's open. Replace with
  // own code if not using jQuery
  jQuery(function ($) {
    var formHandle = $(".callbackHandle");
    if ($(".dateInputClass").hasClass("open")) {
      formHandle.click();
    }
  });
}

/**
 * Add the international dialling codes to the specified dropdown menu.
 */
function addCountryCodes(menu) {
  "use strict";
  logToConsole("Adding country codes");
  var countries = codes.countries;
  for (var entry in countries) {
    if (countries.hasOwnProperty(entry)) {
      var country = countries[entry];
      menu.appendChild(
        addSelectOption(country.name + " (" + country.code + ")", country.code)
      );
    }
  }
}

/**
 * Turns on the form to get the user date
 */
function showCallbackDateForm() {
  "use strict";

  callbackButton = getEl("button-callback");
  callbackTime = getEl("time-callback");
  callbackDate = getEl("date-callback");

  callbackEmail = getEl("email-callback");
  callbackPhone = getEl("phone-callback");
  callbackArea = getEl("area-callback");
  callbackName = getEl("user-callback");
  callbackCountry = getEl("country-callback");
  callbackSkillset = getEl("skillset-callback");

  // add the country codes
  addCountryCodes(callbackCountry);

  // get the skillsets for display purposes
  getSkillsets();

  callbackButton.onclick = function () {
    setCallbackDate();
  };

  for (var i = 6; i <= 20; i++) {
    callbackTime.appendChild(addSelectOption(i + ":00 ", i + ":00 "));
    callbackTime.appendChild(addSelectOption(i + ":15 ", i + ":15 "));
    callbackTime.appendChild(addSelectOption(i + ":30 ", i + ":30 "));
    callbackTime.appendChild(addSelectOption(i + ":45 ", i + ":45 "));
  }
}

/**
 * Creates and returns a select option with the specified value
 * @param value
 * @returns {___anonymous1888_1899}
 */
function addSelectOption(textContent, value) {
  "use strict";
  var selectOption = document.createElement("option");
  selectOption.textContent = textContent;
  selectOption.value = value;
  return selectOption;
}

/**
 * Allows the user to set the time that suits them for an agent to call them
 * back.
 */
function setCallbackDate() {
  "use strict";

  phone = callbackPhone.value;
  custName = callbackName.value;
  email = callbackEmail.value;
  skillset = callbackSkillset.value;
  countryCode = callbackCountry.value;
  areaCode = callbackArea.value;
  var currentTime = new Date();

  user = {
    method: "requestCallback",
    name: custName,
    phone: phone,
    email: email,
    countryCode: countryCode,
    areaCode: areaCode,
    skillset: skillset,
  };

  // the below is dependent on jQuery
  theDate = $("#date-callback").datepicker("getDate");
  var theTime = callbackTime.value.split(":");
  theDate.setHours(theTime[0], theTime[1]);

  // create a new UTC date to maintain consistency with the PHP
  // version, then reset the customer date to use that
  var utcDate = Date.UTC(
    theDate.getFullYear(),
    theDate.getMonth(),
    theDate.getDate(),
    theTime[0],
    theTime[1]
  );
  logToConsole(
    "theDate is " +
      theDate.toString() +
      ". utcDate is " +
      new Date(utcDate).toString()
  );
  theDate = new Date(utcDate);

  if (
    verifyPhone(phone) &&
    verifyDate(currentTime, theDate) &&
    !isCountryCodeEmpty(countryCode)
  ) {
    // calculate the offset for the callback date relative to UTC,
    // using the system clock for the customer's browser
    var rawDate = theDate.getTime();
    var offset = theDate.getTimezoneOffset();
    var newDate = rawDate + offset * 60000;
    user.date = newDate;
    sendJsonRequest(user);
  } else {
    alert("Please enter a valid date and phone number");
  }
}

/**
 * Verifies that a country code has been selected.
 * @param code
 */
function isCountryCodeEmpty(code) {
  "use strict";
  return isStringEmpty(code);
}

/**
 * Verifies a phone number. This one makes sure there are no spaces or letters
 * @param number
 * @returns
 */
function verifyPhone(number) {
  "use strict";

  // this should allow calls from any country in the format 00xxx yyy zzzzzzz
  var re = /^[\+\d][\s\d]+$/;
  return re.test(number);
}

/**
 * Checks that a user hasn't entered a date earlier than their current time.
 * @param currentDate
 * @param date
 * @returns {Boolean}
 */
function verifyDate(currentDate, date) {
  "use strict";

  logToConsole("Customer requested time of " + date.getTime());
  logToConsole("Customer's current time is " + currentDate.getTime());
  return date.getTime() > currentDate.getTime();
}

/**
 * Send a JSON request to the server.
 * @param user
 */
function sendJsonRequest(user) {
  "use strict";

  var request = new XMLHttpRequest();
  request.open("POST", callbackUrl);
  request.timeout = callbackTimeout;

  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      var text = JSON.parse(request.responseText);
      alert(text.status);
    }
  };

  request.setRequestHeader("Content-Type", "application/json");
  request.send(JSON.stringify(user));
}

/**
 * Get all the outbound skillsets.
 */
function getSkillsets() {
  "use strict";

  if (window.XMLHttpRequest) {
    var request = new XMLHttpRequest();
    request.open("POST", callbackUrl);
    request.timeout = callbackTimeout;

    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.status === 200) {
        var data = JSON.parse(request.response);
        processSkillsetsResponse(data);
      }
    };

    // send a basic JSON object
    var json = {
      method: "getSkillsets",
    };

    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(json));
  }
}

/**
 * Refactors the skillset response processing.
 * @param request
 */
function processSkillsetsResponse(requestData) {
  "use strict";

  // loop through the keys of the JSON object and pass the value
  // into a select.
  for (var skillset in requestData) {
    if (requestData.hasOwnProperty(skillset)) {
      var name = requestData[skillset];
      callbackSkillset.appendChild(addSelectOption(name, name));
    }
  }
}
