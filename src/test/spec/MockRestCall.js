/**
 * Mocks a REST call
 */

var MockRestCall = function() {
    'use strict';

    logToConsole("REST Client is online");
    var server;
    var queueAvailable = false;

    this.setServer = function(theServer) {
        this.server = theServer;
    };

    this.sendRequest = function(request) {

        this.server.receiveRequest(JSON.stringify(request));
    };

    this.receiveResponse = function(data) {
        logToConsole("Received a message\n\t" + data);

        if ((data.numberOfAgents + data.numberOfCustomers) < data.maxChats) {
            this.queueAvailable = true;
        } else {
            this.queueAvailable = false;
        }
    };
};

var sender;
var isOpen = false;

/**
 * Mocks an XMLHttpRequest
 */
var MockHttpRequest = function() {
    'use strict';

    logToConsole("REST Server is online");
    this.isOpen = false;
    
    this.receiveRequest = function(data) {
        if (this.isOpen === false) {
            logToConsole("Server not open yet!");
        } else {
            logToConsole("Received a request\n\t" + data);
        }
    };

    this.open = function(method, url, caller) {
        logToConsole("Received a " + method + " to url " + url + " from "
                + caller);
        this.isOpen = true;
        this.sender = caller;
    };

    this.close = function() {
        logToConsole("The connection has been closed");
    };


    this.sendResponse = function(newMaxChats) {
        queue.maxChats = newMaxChats;
        this.sender.receiveResponse(queue);
    };
};