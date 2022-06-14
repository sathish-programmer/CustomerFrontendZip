/**
 * Holds test data for the unit tests
 */

// a mock set of metrics to use across the entire suite
var metrics = [ {
        'queueName' : 'Testing',
        'availableAgentsInQueue' : 20,
        'customersInQueue' : 10,
        'maxConcurrentChats' : 50
    }, {
        'queueName' : 'Debugging',
        'availableAgentsInQueue' : 9,
        'customersInQueue' : 20,
        'maxConcurrentChats' : 50
    } ];


/*
 * Mock details for the webChat tests.
 */

var mockGuid = 123456;
var mockTimestamp = 1000;

var mockAuthKey = '123456';

// the active agent details.
var mockAgentId = '007';
var mockDisplayName = 'James';
var mockURL = 'www.test.com';

var mockErrorCode = 123;
var mockErrorMessage = 'No, Mr Bond. I expect you to die.';

// details of the passive agent.
var mockPassiveAgentId = '123';
var mockPassiveDisplayName = 'Boris';

var testUser = 'Customer';
var testEmail = 'customer@test.net';
var testSkillset = 'Testing';
var testAccount = '1111';

// the reconnect interval will be divided by this number - currently in quarantine
var testMaxReconnections = 5;
var retryIntervalFactor = 50;

// the unit test for the reconnect mechanism is glitchy and needs a delay to work
// it is currently quarantined
var reconnectTestDelay = 4000;

// test callbacks
var testNumber = '00555 555 0434313';
var brokenNumber = '555a3423434';

// test an old date - this is one second after UTC 0
var oldDate = new Date(1000);