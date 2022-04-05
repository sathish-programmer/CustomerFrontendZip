//Websocekt variables
const url = "wss://10.13.228.3:8445/CustomerControllerWeb/chat";
const mywsServer = new WebSocket(url);

//Sending message from client
function sendMsg() {
  const text = "Hii";
  msgGeneration(text, "Client");
  mywsServer.send(text);
}

//Creating DOM element to show received messages on browser page
function msgGeneration(msg, from) {
  const newMessage = "hi new msg";
  // newMessage.innerText = `${from} says: ${msg}`
  // myMessages.appendChild(newMessage)
}

//enabling send message when connection is open
mywsServer.onopen = function () {
  sendBtn.disabled = false;
};

//handling message event
mywsServer.onmessage = function (event) {
  const { data } = event;
  msgGeneration(data, "Server");
};
