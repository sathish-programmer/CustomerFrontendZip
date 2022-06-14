/**
 * This is a full set of tests for Mocha to run. Run these using grunt mocha inside
 * the Customer Frontend project, or open the html page.
 */

describe('Testing global functions', function() {

    'use strict';
  
    // testing the getEl function
    it('getEl should return a specified div', function() {
        var testDiv  = getEl('getElTestDiv');
        expect(testDiv).to.equal(document.getElementById('getElTestDiv'));
    });

    // testing set and getSessionStorage
    it('GetSessionStorage should return the correct value for a specific key', function() {
        setSessionStorage('storeTest', 'Test');
        var test = getSessionStorage('storeTest');
        expect(test).to.equal('Test');
    });

    // check that detectBrowserSupport exists
    it('The function detectBrowserSupport should exist', function() {
        expect(detectBrowserSupport).to.exist;
    });
    
});


describe('Testing the checkQueue functions', function() {

    'use strict';

    var restClient = new MockRestCall();
    var restServer = new MockHttpRequest();
    restClient.setServer(restServer);

    it('isStringEmpty should confirm that an empty string is actually empty', function() {
        var testString = '';
        expect(isStringEmpty(testString)).to.equal(true);
    });

    // test the createJson method.
    it('createJSON should return a JSON object with a single value', function() {
        var json = createJson('test');
        expect(json).to.include('test');
    });

    // test the queueCheck using the mock objects above.
    it('The servlet should "receive" the REST call ', function() {
        var method = 'POST', url = 'test', requestJson = createJson('test');
        restServer.open(method, url, restClient);
        restClient.sendRequest(requestJson);
        expect(restServer.isOpen).to.equal(true);

    });

    // test the filterQueues method here. With the metrics object above, it should
    // return an array of one skillset.
    it('The filterQueues method should remove queue2, but not queue1', function() {
        var newQueues = removeFullQueues(metrics);
        expect(newQueues.length).to.equal(1);
    });

    // test the checkAllSkillsets method here
    it('The checkAllSkillsets function should return true, as at least one queue is available', function() {
        var isQueueAvailable = checkAllSkillsets(metrics);
        expect(isQueueAvailable).to.equal(true);
    });

    // test the checkSkillset method here
    it('The checkSkillset function should return true, as the queue is available', function() {
        var isQueueAvailable = checkSkillset(metrics);
        expect(isQueueAvailable).to.equal(true);
    });

});


describe('Testing the webChatLogon functions', function() {
    'use strict';

    // test the parseEmail function  with a "legit" email
    it('The sample email address "test@test.net" should pass the regex', function() {
        expect(parseEmail('test@test.net')).to.equal(true);
    });
    
    // test the parseEmail function with an email that fails
    it('The sample email address "test@testnet" should fail the regex', function() {
        expect(parseEmail('test@testnet')).to.equal(false);
    });
    
    // go through sessionStorage again. With two queues going in, one should go out
    it('Filter queue and add to sessionStorage again', function() {
        var queues = removeFullQueues(metrics);
        expect(queues.length).to.equal(1);
        setSessionStorage('queues', JSON.stringify(queues));
    });

    // test the setSkillsets function
    it('The setSkillsets function should add the correct number of queues to the skillsetSelect', function() {
        var skillsetSelect = getEl('skillset-chat');
        skillsetSelect.textContent = '';
        var queues = JSON.parse(getSessionStorage('queues'));
        setSkillsets(queues);
        expect(queues.length).to.equal(1);
        expect(skillsetSelect.children.length).to.equal(1);
    });

});


/**
 * A mock Message object to act as a template for the simpler messages
 */
var MockMessage = {
    'apiVersion' : '1.0',
    'type' : 'msgType',
    'body' : {
        'method' : 'tempMethod'
    }
};

describe('Testing the webChat and webChatSocket functions', function() {
    'use strict';

    var server = new MockWebSocketServer();
    var client = new MockWebSocketClient();
    client.openClient(server);
    

    // initialisation runs here
    before(function() {
        //overwrite the normal WebSocket with the mockClientObject
        webSocket = client;
        sendMessage = client.sendJson;
        g_user = testUser, g_email = testEmail, g_account = testAccount, g_skillset = testSkillset;
        g_phone = {
                'country' : '+353',
                'area' : '091',
                'phone' : '020202020'
        };
        users = {};
    });
    
    // open the WebSocket
    it('The WebSocket should open normally', function() {
        expect(server.client).to.equal(client);
        expect(client.server).to.equal(server);
    });

    /*
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     * Test sending messages to the server.
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     */
    it('The WebSocket should be able to send a chat request with specific login details', function() {
        chatLogin(testUser, testEmail, testAccount, testSkillset, g_phone);
        var msgBody = server.inMsg.body;
        expect(msgBody.method).to.equal('requestChat');
        expect(msgBody.intrinsics.email).to.equal(testEmail);
        expect(msgBody.intrinsics.name).to.equal(testUser);
    });

    it('The WebSocket should be able to send a normal chat message', function() {
        outMessage = getEl('outmessage');
        var testMessage = 'Hello!';
        outMessage.value = testMessage;
        sendChatMessage();
        var msgBody = server.inMsg.body;
        expect(msgBody.message).to.equal(testMessage);
    });

    it('The WebSocket should be create a true isTyping message', function() {
        sendIsTyping(true);
        var msgBody = server.inMsg.body;
        expect(msgBody.isTyping).to.equal(true);
    });

    it('The WebSocket should be create a false isTyping message', function() {
        sendIsTyping(false);
        var msgBody = server.inMsg.body;
        expect(msgBody.isTyping).to.equal(false);
    });

    // testing that a customer can send a queue status request
    it('The WebSocket should be able to send a status request', function() {
        sendQueueStatusRequest();
        var msgBody = server.inMsg.body;
        expect(msgBody.method).to.equal('queueStatus');
    });
    
    it('The WebSocket should be able to send a PagePushRequest', function() {
        getEl('urlInput').value = mockURL;
        sendPagePushRequest();
        var msgBody = server.inMsg.body;
        expect(msgBody.method).to.equal('newPushPageMessage');
        assert.equal(mockURL, msgBody.pagePushURL, 'The received URL matches the sent URL');
    });
    
    // RealTimeMessages aren't supported yet, so skip this test for now
    it.skip('The WebSocket should be able to send a RealTimeMessage request - not supported yet', function(){
        var msg = {
                'apiVersion' : '1.0',
                'type' : 'request',
                'body' : {
                    'method' : 'newRTTMessage',
                    'message' : 'Testing'
                }
        };
        client.sendMessage(msg);
        expect(server.inMsg.body.method).to.equal('newRTTMessage');
        
    });

    /*
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     * Test messages being received from the server
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     */

    
    it('The client should be able to process a message of type newChatAcknowledgement', function() {
        
        // start with the template message
        var ack = MockMessage;
        ack.type = messageTypeAck;
        ack.body.method = 'test';
        ack.body.accepted = true;
        server.sendMessage(ack);
        assert.doesNotThrow(MockWebSocketClient.prototype.receiveMessage, TypeError);
    });

    // testing error messages
    it('The client should be able to process a message of type error', function() {
        var err = MockMessage;
        err.type = 'error';
        err.body.method = 'newMessage';
        err.body.code = 123;
        err.body.errorMessage = 'No, Mr Bond. I expect you to die';
        server.sendMessage(err);
        assert.doesNotThrow(MockWebSocketClient.prototype.receiveMessage, TypeError);
    });

    // test the requestChatNotification
    it('The client should be able to process a requestChatNotification', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'requestChat',
                'guid' : mockGuid,
                'webOnHoldComfortGroups' : [ {
                    'groupName' : 'test group 1',
                    'delay' : 45,
                    'numberOfMessages' : 2,
                    'messages' : [ {
                        'message' : 'first comfort message',
                        'sequence' : 1
                    } ]
                } ],
                'webOnHoldURLs' : [ {
                    'tag' : 'Some tag name',
                    'description' : 'Test homepage',
                    'holdTime' : 30,
                    'sequence' : 1,
                    'urls' : [ {
                        'url' : 'http://www.google.ie'
                    }, {
                        'url' : 'http://www.avaya.com'
                    } ]
                } ],
                'intrinsics' : {
                    'name' : testUser,
                    'telephone' : '087-1234567',
                    'accountNumber' : testAccount,
                    'email' : testEmail
                }
            }
        };

        server.sendMessage(not);
        assert.strictEqual(guid, mockGuid, 'The guid is properly assigned');
    });

    it('The client should be able to process a newParticipant notification', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'newParticipant',
                'agentId' : mockAgentId,
                'displayName' : mockDisplayName,
                'participantRole' : 'supervisor',
                'numberOfParticipants' : 2,
                'participants' : [ {
                    'id' : mockAgentId,
                    'name' : mockDisplayName,
                    'type' : 'active_participant'
                }, {
                    'id' : '006',
                    'name' : 'Alec',
                    'type' : 'passive_participant'
                } ]
            }
        };

        server.sendMessage(not);
        expect(users[mockAgentId].name).to.equal(mockDisplayName);
        expect(users['006'].name).to.equal('Alec');
    });

    it('The client should be able to process an isTyping notification', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'isTyping',
                'agentId' : mockAgentId,
                'displayName' : mockDisplayName,
                'isTyping' : true
            }
        };

        server.sendMessage(not);
        expect(users[mockAgentId].isTyping).to.equal(true);
    });
    
        
    // running this after isTyping
    it('The client should be able to process a participantLeave notification', function() {
        logToConsole('Debugging users:' + users);
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'participantLeave',
                'agentId' : mockAgentId,
                'endChatFlag' : false,
                'numberOfParticipants' : 1,
                'participants' : [ {
                    'id' : mockAgentId,
                    'name' : mockDisplayName,
                    'type' : 'active_participant'
                }]
            }
        };

        server.sendMessage(not);
        expect(users[mockAgentId].name).to.equal(mockDisplayName);
        // this is analagous to expect(users['006']).to.equal(undefined) - it assets that there is no agent 006
        assert.isUndefined(users['006'], 'Agent 006 is dead.');
    });


    it('The client should be able to process a newMessage notification', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'newMessage',
                'message' : 'Vodka martini, please',
                'displayName' : mockDisplayName,
                'timestamp' : mockTimestamp
            }
        };

        server.sendMessage(not);
        assert.doesNotThrow(MockWebSocketClient.prototype.receiveMessage, TypeError);
    });

    it('The client should be able to process a page push notification', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'newPushPageMessage',
                'displayName' : mockDisplayName,
                'message' : 'Drink?',
                'pagePushURL' : mockURL,
                'pagePushDestination' : 'newTab',
                'timestamp' : mockTimestamp
            }
        };

        server.sendMessage(not);
        assert.doesNotThrow(MockWebSocketClient.prototype.receiveMessage, TypeError);
    });

    it('The client should be able to process an acknowledgement notification', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'acknowledgement',
            'body' : {
                'method' : 'newmessage',
                'result' : true
            }
        };

        server.sendMessage(not);
        assert.doesNotThrow(MockWebSocketClient.prototype.receiveMessage, TypeError);
    });

    it('The client should be able to process a queueStatus notification', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'queueStatus',
                'positionInQueue' : 1,
                'estimatedWaitTime' : 62
            }
        };

        var messageCount = messages.childElementCount;
        server.sendMessage(not);
        var newMessageCount = messages.childElementCount;
        logToConsole(messageCount + ' messages before sending queue status notification, ' + newMessageCount + ' after');
        expect(newMessageCount).to.be.above(messageCount);
    });
    
    it('If the estimated wait time is less than 1 minute, it should not be shown', function() {
        var not = {
                'apiVersion' : '1.0',
                'type' : 'notification',
                'body' : {
                    'method' : 'queueStatus',
                    'positionInQueue' : 0,
                    'estimatedWaitTime' : 45
                }
            };
        
        var messageCount = messages.childElementCount;
        server.sendMessage(not);
        var newMessageCount = messages.childElementCount;
        logToConsole(messageCount + ' messages before sending queue status message with position of 0, ' + newMessageCount + ' after');
        expect(newMessageCount).to.equal(messageCount);
    });

    // realTimeMessages are not supported yet, so ignore the test for now.
    it.skip('The client should be able to process a newRealTimeMessage notification - not supported yet', function() {
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'newRTTMessage',
                'displayName' : mockDisplayName,
                'message' : 'Testing'
            }
        };

        server.sendMessage(not);
        assert.doesNotThrow(MockWebSocketClient.prototype.receiveMessage, TypeError);
    });
    
    
    /*
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     * Test the isTyping mechanism
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     */

    it('isTyping should be true when pressed', function(done) {
        client.openClient(server);
        
        var newPart = {
                'apiVersion' : '1.0',
                'type' : 'notification',
                'body' : {
                    'method' : 'newParticipant',
                    'agentId' : mockAgentId,
                    'displayName' : mockDisplayName,
                    'participantRole' : 'supervisor',
                    'numberOfParticipants' : 2,
                    'participants' : [ {
                        'id' : mockAgentId,
                        'name' : mockDisplayName,
                        'type' : 'active_participant'
                    }]
                }
            };
        
        server.sendMessage(newPart);
        
        startTypingTimer();
        setTimeout(done, 10);
        expect(isTyping).to.equal(true);

    });

    it('isTyping should be false two seconds later', function(done) {
        
        // give this a 5 second timeout instead of the default 2 seconds
        this.timeout(5000);
        var oldTimeout = typingTimeout;
        typingTimeout = 2000;
        startTypingTimer();
        
        // wait a little more than 2 seconds to be certain
        setTimeout(function() {
            done();
            expect(isTyping).to.equal(false);
        }, 2010);
        typingTimeout = oldTimeout;

    });

    it('The client should be alerted if an agent has stopped typing', function() {
        
        // overwrite the default timeout
        this.timeout(agentTypingTimeout + 500);
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'isTyping',
                'agentId' : mockAgentId,
                'displayName' : mockDisplayName,
                'isTyping' : true
            }
        };

        server.sendMessage(not);
        setTimeout(function() {
            expect(users[mockAgentId].isTyping).to.equal(false);
            }, agentTypingTimeout);
        
    });

    
    /*
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     * Test the reconnect mechanism and closing
     * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
     */
    
    it('The client should be able to process a closeConversation notification', function() {
        dontRetryConnection = true;
        var not = {
            'apiVersion' : '1.0',
            'type' : 'notification',
            'body' : {
                'method' : 'closeConversation',
                'result' : true
            }
        };

        server.sendMessage(not);
        expect(client.isOpen).to.equal(false);
    });
    
    // this one is in quarantine - it doesn't entirely work.
    it.skip('Reconnection should fail after ten attempts - glitchy and requires a delay to work properly', function(done) {
        this.timeout(retryInterval * 10 + (reconnectTestDelay * 1.5));
        client.isOpen = true;
        
        var oldRetry = retryInterval;
        retryInterval /= retryIntervalFactor;
        dontRetryConnection = false;
        setTimeout(function() {
            
            client.close(1006, 'Error!', retryInterval);
            
            setTimeout(function() {
                console.log('Waited for 2 intervals. Client is open? ' + client.isOpen);
                expect(client.isOpen).to.equal(true);
            }, (retryInterval * 2));
            
            setTimeout(function() {
                console.log('Waited for 5 intervals. Client is open? ' + client.isOpen);
                expect(client.isOpen).to.equal(true);
            }, (retryInterval * 5));
            
            
            setTimeout(function() {
                console.log('Waited for 8 intervals. Client is open? ' + client.isOpen);
                expect(client.isOpen).to.equal(true);
            }, (retryInterval * 8) );
            
            setTimeout(function() {
                console.log('Waited for 10 intervals. Client is open? ' + client.isOpen);
                done();
                expect(client.isOpen).to.equal(false);
            }, (retryInterval * 10) + 500 );
        
        retryInterval = oldRetry;
        }, reconnectTestDelay);
    });

});
