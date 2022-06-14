/**
 * callback.js
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
 * This section handles callback requests and does not rely on WebSockets.
 * Instead, it sends a JSON object to the backend, which handles the grunt work.
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

var callbackDay;
var callbackMonth;
var callbackHour;
var callbackMinute;

var callbackButton;
var callbackTime;
var callbackDate;

var callbackEmail;
var callbackPhone;
var callbackCountry;
var callbackArea;
var callbackName;
var callbackSkillset;

var countryCode = '';
var areaCode = '';
var email = '';
var custName = '';
var phone;
var skillset;

var theDate;

// store the user details in a JSON object for convenience
var user = {};

/**
 * Hides the callback date form.
 */
function hideCallbackDateForm() {
    'use strict';

    // call jQuery and tell it to slide the div in if it's open. Replace with
    // own code if not using jQuery
    jQuery(function($) {
        var formHandle = $('.callbackHandle');
        if ($('.dateInputClass').hasClass('open')) {
            formHandle.click();
        }
    });
}

/**
 * Add the international dialling codes to the specified dropdown menu.
 */
function addCountryCodes(menu) {
    'use strict';
    logToConsole('Adding country codes');
    var countries = codes.countries;
    for ( var entry in countries) {
        if (countries.hasOwnProperty(entry)) {
            var country = countries[entry];
            menu.appendChild(addSelectOption(country.name + ' (' + country.code + ')', country.code));
        }
    }
}

/**
 * Turns on the form to get the user date
 */
function showCallbackDateForm() {
    'use strict';

    callbackButton = getEl('button-callback');
    callbackTime = getEl('time-callback');
    callbackDate = getEl('date-callback');

    callbackEmail = getEl('email-callback');
    callbackPhone = getEl('phone-callback');
    callbackArea = getEl('area-callback');
    callbackName = getEl('user-callback');
    callbackCountry = getEl('country-callback');
    callbackSkillset = getEl('skillset-callback');

    // add the country codes
    addCountryCodes(callbackCountry);

    // get the skillsets for display purposes
    getSkillsets();

    callbackButton.onclick = function() {
        setCallbackDate();
    };

    for (var i = 6; i <= 20; i++) {
        callbackTime.appendChild(addSelectOption(i + ':00 ', i + ':00 '));
        callbackTime.appendChild(addSelectOption(i + ':15 ', i + ':15 '));
        callbackTime.appendChild(addSelectOption(i + ':30 ', i + ':30 '));
        callbackTime.appendChild(addSelectOption(i + ':45 ', i + ':45 '));
    }

}

/**
 * Creates and returns a select option with the specified value
 * @param value
 * @returns {___anonymous1888_1899}
 */
function addSelectOption(textContent, value) {
    'use strict';
    var selectOption = document.createElement('option');
    selectOption.textContent = textContent;
    selectOption.value = value;
    return selectOption;
}

/**
 * Allows the user to set the time that suits them for an agent to call them
 * back.
 */
function setCallbackDate() {
    'use strict';

    phone = callbackPhone.value;
    custName = callbackName.value;
    email = callbackEmail.value;
    skillset = callbackSkillset.value;
    countryCode = callbackCountry.value;
    areaCode = callbackArea.value;
    var currentTime = new Date();

    user = {
        'method' : 'requestCallback',
        'name' : custName,
        'phone' : phone,
        'email' : email,
        'countryCode' : countryCode,
        'areaCode' : areaCode,
        'skillset' : skillset
    };

    // the below is dependent on jQuery
    theDate = $('#date-callback').datepicker('getDate');
    var theTime = callbackTime.value.split(':');
    theDate.setHours(theTime[0], theTime[1]);

    // create a new UTC date to maintain consistency with the PHP
    // version, then reset the customer date to use that
    var utcDate = Date.UTC(theDate.getFullYear(), theDate.getMonth(), theDate.getDate(), theTime[0], theTime[1]);
    logToConsole('theDate is ' + theDate.toString() + '. utcDate is ' + new Date(utcDate).toString());
    theDate = new Date(utcDate);

    if (verifyPhone(phone) && verifyDate(currentTime, theDate) && !isCountryCodeEmpty(countryCode)) {

        // calculate the offset for the callback date relative to UTC,
        // using the system clock for the customer's browser
        var rawDate = theDate.getTime();
        var offset = theDate.getTimezoneOffset();
        var newDate = rawDate + (offset * 60000);
        user.date = (newDate);
        sendJsonRequest(user);
    } else {
        alert('Please enter a valid date and phone number');
    }
}

/**
 * Verifies that a country code has been selected.
 * @param code
 */
function isCountryCodeEmpty(code) {
    'use strict';
    return isStringEmpty(code);
}

/**
 * Verifies a phone number. This one makes sure there are no spaces or letters
 * @param number
 * @returns
 */
function verifyPhone(number) {
    'use strict';

    // this should allow calls from any country in the format 00xxx yyy zzzzzzz
    var re = /^[\+\d][\s\d]+$/;
    return re.test(number);
}

/**
 * Checks that a user hasn't entered a date earlier than their current time.
 * @param currentDate
 * @param date
 * @returns {Boolean}
 */
function verifyDate(currentDate, date) {
    'use strict';

    logToConsole('Customer requested time of ' + date.getTime());
    logToConsole('Customer\'s current time is ' + currentDate.getTime());
    return (date.getTime() > currentDate.getTime());
}

/**
 * Send a JSON request to the server.
 * @param user
 */
function sendJsonRequest(user) {
    'use strict';

    var request = new XMLHttpRequest();
    request.open('POST', callbackUrl);
    request.timeout = callbackTimeout;

    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            var text = JSON.parse(request.responseText);
            alert(text.status);
        }
    };

    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(user));
}

/**
 * Get all the outbound skillsets.
 */
function getSkillsets() {
    'use strict';

    if (window.XMLHttpRequest) {
        var request = new XMLHttpRequest();
        request.open('POST', callbackUrl);
        request.timeout = callbackTimeout;

        request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 200) {
                var data = JSON.parse(request.response);
                processSkillsetsResponse(data);
            }
        };

        // send a basic JSON object
        var json = {
            'method' : 'getSkillsets'
        };

        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSON.stringify(json));
    }

}

/**
 * Refactors the skillset response processing.
 * @param request
 */
function processSkillsetsResponse(requestData) {
    'use strict';

    // loop through the keys of the JSON object and pass the value
    // into a select.
    for ( var skillset in requestData) {
        if (requestData.hasOwnProperty(skillset)) {
            var name = requestData[skillset];
            callbackSkillset.appendChild(addSelectOption(name, name));
        }

    }
}
