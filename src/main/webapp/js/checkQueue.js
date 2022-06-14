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
    'use strict';
    return (str.length === 0);
}

/**
 * Creates a JSON message for a particular skillset value.
 * @param value for the skillset
 * @returns msg as a JSON string
 */
function createJson(value) {
    'use strict';
    var msg = {
        'skillset' : value
    };
    return JSON.stringify(msg);
}

/**
 * Receives a JSON object from the server which contains the queue status.
 * @param data from the server
 * @param button or elemen that enables the chat window
 */
function receiveQueueStatus(data, button) {
    'use strict';
    var msg = JSON.parse(data), metrics = msg.body.metrics;
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
    'use strict';
    logToConsole('Asked specifically for ' + pageSkillset);
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
    'use strict';
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
    'use strict';

    return metrics
            .filter(function(queue) {
                return ((queue.customersInQueue <= (queue.availableAgentsInQueue * customerSoakValue) && queue.customersInQueue <= queue.maxConcurrentChats) && queue.availableAgentsInQueue > 0);
            });
}

/**
 * Toggles the chat button if there is a queue available.
 * @param isQueueAvailable
 */
function toggleChatButton(isQueueAvailable, chatButton, metrics) {
    'use strict';
    if (isQueueAvailable === true) {
        chatButton.removeAttribute('hidden');
        chatButton.style.visibility = 'visible';
    }
}

/**
 * Toggles the chat button depending on the availability of a particular
 * skillset
 * @param skillset
 */
function startQueueCheck() {
    'use strict';

    // if XMLHttpRequest and WebSocket are supported by the browser,
    // perform the queue check. Otherwise, don't bother.
    if (XMLHttpRequest && WebSocket) {
        var chatButton = getEl('chatPanel'), server = new XMLHttpRequest({
            mozSystem : true,
            timeout : queueTimeout
        });
        pageSkillset = getEl('pageSkillSet').value;
        chatButton.setAttribute('hidden', 'hidden');
        chatButton.style.visibility = 'hidden';

        // Creates an event listener for the request using the
        // requestQueueStatus function
        server.onreadystatechange = function() {
            if (server.readyState === 4 && server.status === 200) {
                receiveQueueStatus(server.response, chatButton);
            }
        };

        server.ontimeout = function() {
            logToConsole('Could not connect to the backend');
        };

        // by default, XMLHttpRequests are asynchronous, and therefore require
        // an event listener
        server.open('POST', restUrl);
        server.setRequestHeader('Content-Type', 'application/json');
        server.send(createJson(pageSkillset));
    }
}

/**
 * Opens the webChatLogon page in a separate window.
 */
function createLogonWindow() {
    'use strict';
    var link = 'webChatLogon.html';
    window.open(link, 'Web Chat Logon', 'width=400,height=500,resizable=yes');
}
