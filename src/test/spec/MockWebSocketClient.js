/**
 * Mocks a client-end WebSocket
 */

var clientName = '';
var inMsg;
var server;

var MockWebSocketClient = function(newServer) {

    this.server = newServer;
    this.isOpen = false;

    MockWebSocketClient.prototype.openClient = function(newServer) {
        this.server = newServer;
        this.isOpen = true;
        this.server.openServer(this);
    };

    /**
     * Mocks the sendJson method in the webchat.js file
     */
    MockWebSocketClient.prototype.sendJson = function(outMsg) {
        MockWebSocketServer.prototype.handleMessage(JSON.stringify(outMsg));
    };

    /**
     * This accepts a JSON string as opposed to a MessageEvent
     * @see https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
     */
    MockWebSocketClient.prototype.receiveMessage = function(event) {
        var msg = JSON.parse(event), body = msg.body, method = body.method;

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
            throw new TypeError('Unknown message type received:\n' + msg);
        }
    };

    MockWebSocketClient.prototype.close = function(code, msg, interval) {
        logToConsole('Closed webSocket with code ' + code + ' (' + msg + ')');

        if (dontRetryConnection === true) {
            this.isOpen = false;
        } else {
            logToConsole('Reconnecting');
            this.retryConnection(interval);
        }

    };
    
    MockWebSocketClient.prototype.retryConnection = function (newInterval) {
        var self = this;
        setTimeout(function() {
            if (totalNumberOfRetrys <= maxNumberOfRetrys) {
                openSocket();
                totalNumberOfRetrys++;
                self.retryConnection(newInterval);
            } else {
                logToConsole('Connection failed');
                writeResponse('Reconnection has failed', writeResponseClassResponse);
                dontRetryConnection = true;
                self.isOpen = false;
            }
            
        }, newInterval);
    };
};
