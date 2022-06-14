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
var browserWarning = 'Your browser does not support required features for this website. The earliest supported versions are Internet Explorer 10, Firefox 11, Chrome 31, Safari 7.1 and Opera 12.1';

// If using a popup for chat, set this to true
var usePopupForChat = false;

// the timeout for the currentqueue REST call
var queueTimeout = 60000;

// the timeout for the callback REST calls
var callbackTimeout = 60000;

// Detect browser support when ready
document.onreadystatechange = function() {
    'use strict';

    // IE 10 does not appear to recognise 'interactive' - however, IE 11,
    // Firefox and Chrome do
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
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
    'use strict';
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
    'use strict';
    return document.getElementById(el);
}

/**
 * Checks if the user's browser supports the required features. For the chat to
 * work, the browser <b>MUST</b> support JSON parsing, WebSockets and
 * XMLHttpRequests. If it does not support any of these, alert the user.
 */
function detectBrowserSupport() {
    'use strict';
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
    'use strict';
    sessionStorage.setItem(key, value);
}

/**
 * Get the specified item from sessionStorage
 * @param key
 * @returns
 */
function getSessionStorage(key) {
    'use strict';
    return sessionStorage.getItem(key);
}

/**
 * Gathers all elements on page load.
 */
function gatherElements() {
    'use strict';
    logToConsole('Gathering elements');
    sendButton = getEl('sendbutton-chat');
    callbackRequestButton = getEl('callbackPanel');
    closeButton = getEl('closebutton-chat');
    messages = getEl('messages');
    outMessage = getEl('outmessage');
    participants = getEl('participants');
    pagePushDiv = getEl('pagePushDiv');
}

/**
 * Clear the user details from session storage.
 */
function clearSessionStorage() {
    'use strict';
    setSessionStorage('user', '');
    setSessionStorage('phone', '');
    setSessionStorage('email', '');
    setSessionStorage('account', '');
    setSessionStorage('skillset', '');
    setSessionStorage('subject', '');
}
