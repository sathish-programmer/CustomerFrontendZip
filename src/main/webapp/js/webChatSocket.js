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
    'use strict';
    participants = getEl('participants');
    logToConsole('Opening the WebSocket');

    // Ensures only one connection is open at a time
    if (webSocket !== undefined && (webSocket.readyState !== WebSocket.CLOSED)) {
        logToConsole('WebSocket is already opened');
        return;
    }

    clearTimeout(reconnectionTimeout);

    // Create a new instance of the WebSocket using the specified url
    webSocket = new WebSocket(webChatUrl);

    // Binds functions to the listeners for the websocket.
    webSocket.onopen = handleOpen;
    webSocket.onmessage = handleMessage;
    webSocket.onclose = function(event) {

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
    'use strict';

    // if there are agents in the chat, enable the controls
    if (Object.keys(users).length <= 0) {
        logToConsole('No users in room, disabling controls');
        disableControls(true);
    } else {
        logToConsole('Agents already in chat, enabling controls');
        disableControls(false);
    }

    pingInterval = setInterval(function() {
        sendPing();
    }, pingTimer);
    timeouts.push(pingInterval);

    chatLogin(g_user, g_email, g_account, g_skillset, g_phone);
}

/**
 * Handles incoming messages. The message is parsed as a JSON object, and then
 * handled according to the message type.
 * @param event
 */
function handleMessage(event) {
    'use strict';
    var msg = JSON.parse(event.data), body = msg.body, method = body.method;

    // Handle the message according to the type and method.
    // Notifications are in their own method to reduce complexity.
    if (msg.type === messageTypeNotification) {
        handleNotification(msg);
    } else if (msg.type === messageTypeError) {
        writeResponse('An error occurred ' + body.code + ' (' + body.errorMessage + ')', writeResponseClassResponse);
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
        writeResponse('Chat request approved', writeResponseClassResponse);
    } else {
        throw new TypeError('Unknown message type:\n' + msg);
    }
}
/**
 * Upon closing, inform the user and disable the controls.
 * @param event
 */
function handleClose() {
    'use strict';
    logToConsole('Definitely closing the WebSocket.');
    writeResponse('Connection closed', writeResponseClassResponse);
    disableControls(true);
    outMessage.textContent = '';
    clearAllTimeouts();

    updateUsers();
}

/**
 * Handles errors by printing them to the browser console and alerting the user.
 * @param event
 */
function handleError(event) {
    'use strict';
    logToConsole(event);
    writeResponse('A connection error has occurred', writeResponseClassResponse);
}

/**
 * Upon disconnection, this will attempt to reconnect to a WebSocket every
 * @param retryInterval
 * @param totalNumberOfRetrys
 */
function reconnect() {
    'use strict';
    if (webSocket.readyState !== webSocket.OPEN) {
        reconnectionTimeout = setTimeout(function() {
            if (totalNumberOfRetrys <= maxNumberOfRetrys) {
                logToConsole('Connection failed. Reconnecting (attempt ' + totalNumberOfRetrys + ' of ' +
                        maxNumberOfRetrys + ')');
                openSocket();

                if (!dontRetryConnection) {
                    clearTimeout(reconnectionTimeout);
                    totalNumberOfRetrys++;
                    reconnect();
                }

            } else {
                dontRetryConnection = true;
                writeResponse('Connection failed', writeResponseClassResponse);
            }
        }, retryInterval);
    }

}

/**
 * Called after a successful connection to reset the counter for number of
 * socketConnection retries
 */
function resetConnectionAttempts() {
    'use strict';
    totalNumberOfRetrys = 0;
    dontRetryConnection = false;
    clearTimeout(reconnectionTimeout);

}

/**
 * Stringifies a JSON object and sends it over the WebSocket.
 * @param outMsg
 */
function sendMessage(outMsg) {
    'use strict';
    if (webSocket !== null && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify(outMsg));
    }
}
