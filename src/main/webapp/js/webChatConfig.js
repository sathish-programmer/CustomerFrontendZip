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
var messageTypeNewChatAck = 'newChatAcknowledgement';
var messageTypeAck = 'acknowledgement';
var messageTypeError = 'error';
var messageTypeNotification = 'notification';

// Json method names for notification messages
var jsonMethodRequestChat = 'requestChat';
var jsonMethodRequestCallBack = 'callBack';
var jsonMethodRequestNewParticipant = 'newParticipant';
var jsonMethodRequestisTyping = 'isTyping';
var jsonMethodRequestNewMessage = 'newMessage';
var jsonMethodRequestCloseConversation = 'closeConversation';
var jsonMethodRequestParticipantLeave = 'participantLeave';
var jsonMethodRequestNewPushMessage = 'newPushPageMessage';
var jsonMethodRequestRequestTranscript = 'requestTranscript';
var jsonMethodRequestQueueMetrics = 'queueStatus';
var jsonMethodPing = 'ping';

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
var writeResponseClassResponse = 'response';
var writeResponseClassSent = 'sent';

// Images for the users panel
var agentImage = 'images/agent.png';
var agentTypingImage = 'images/agent_typing.png';
var supervisorImage = 'images/supervisor.png';
var supervisorTypingImage = 'images/supervisor_typing.png';
