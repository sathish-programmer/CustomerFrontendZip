/**
 * webChatLogon.js
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
 * This section defines the functionality for the logon window
 *
 * \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 */

/**
 * Parses an email to check that it is valid. Only checks if there is an '@' and
 * a dot after the '@', but that will cover the vast majority of all email
 * addresses
 * @param emailToParse
 * @returns {Boolean}
 */
function parseEmail(emailToParse) {
  "use strict";
  // this regex allows any alphanumeric character
  var re = /[\w\.]+@\w+\.\w+/;
  return re.test(emailToParse);
}

/**
 * Logs a user with specific details into the chat.
 * @param name
 * @param phone
 * @param email
 * @param skillset
 */
function logon(name, phone, email, skillset) {
  "use strict";
  // if the email address is empty or otherwise invalid, alert the user.
  // if they accept this, then continue
  var confirm = true;
  var isValid = parseEmail(email);
  if (isValid === false) {
    confirm = window.confirm(
      "You may use the chat without a valid email, but you will not be able to receive transcripts of the conversation"
    );
  }

  if (confirm === true) {
    // if the customer's email was invalid, and they went ahead,
    // reset it
    if (isValid === false) {
      logToConsole("Email was invalid, resetting");
      email = "";
      setSessionStorage("email", email);
    }

    if (usePopupForChat) {
      window.open("WebChat.html", "_self");
    } else {
      switchFormToChat();
      openChat();
    }
  }
}

/**
 * Switches the form to logon mode
 */
function switchFormToLogon() {
  "use strict";
  getEl("chatForm").style.display = "block";
  getEl("chatInterface").style.display = "none";
  getEl("chatPanel").style.height = "183px";
}

/**
 * Switches the form to chat mode
 */
function switchFormToChat() {
  "use strict";
  getEl("chatForm").style.display = "none";
  getEl("chatInterface").style.display = "block";
  getEl("chatPanel").style.height = "363px";
}

/**
 * Set the skillsets according to the queue information.
 */
function setSkillsets(queues) {
  "use strict";
  var skillsetSelect = getEl("skillset-chat");

  // add the country codes to the phone callback
  var chatCountry = getEl("country-chat");
  addCountryCodes(chatCountry);

  // if a queue has space, show it as being available
  for (var l = 0; l < queues.length; l++) {
    var theQueue = queues[l];
    logToConsole("Adding " + theQueue.queueName + " to the logon page");
    var newOption = document.createElement("option");
    newOption.value = theQueue.queueName;
    newOption.text = theQueue.queueName;
    skillsetSelect.appendChild(newOption);
  }
}

/**
 * Gathers the users details and adds them to sessionStorage.
 */
function gatherDetails() {
  "use strict";
  var l_user = getEl("user-chat").value,
    l_country = getEl("country-chat").value,
    l_email = getEl("email-chat").value,
    l_skillset = getEl("skillset-chat").value;

  // store the phone details in a JSON object for convenience
  var l_phone = {
    country: getEl("country-chat").value,
    area: getEl("area-chat").value,
    phone: getEl("phone-chat").value,
  };

  setSessionStorage("user", l_user);
  setSessionStorage("phone", JSON.stringify(l_phone));
  setSessionStorage("country", l_country);
  setSessionStorage("email", l_email);
  setSessionStorage("skillset", l_skillset);
  logon(l_user, l_phone, l_email, l_skillset);
}
