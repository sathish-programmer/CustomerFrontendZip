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
