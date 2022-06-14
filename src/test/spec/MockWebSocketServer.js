/**
 * Mocks a WebSocketServer
 */

var client;
var incoming;

var MockWebSocketServer = function() {

    'use strict';
    
    /**
     * Open a connection from the client to the server.
     */
    MockWebSocketServer.prototype.openServer = function(newClient) {
        this.client = newClient;
    };
    
    /**
     * Receive a message from the client
     */
    MockWebSocketServer.prototype.handleMessage = function(msg) {
        this.inMsg = JSON.parse(msg);
    };
    
    /**
     * Send a message to the client
     */
    MockWebSocketServer.prototype.sendMessage = function(msg) {
        this.client.receiveMessage(JSON.stringify(msg));
    };

};