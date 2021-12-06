const name = prompt('Whats your name?');

const textarea = document.querySelector('textarea');
const input = document.querySelector('input');
input.placeholder = `Say something, ${name}`;

const webSocket = new WebSocket(`ws://${location.host}`);

webSocket.addEventListener('open', function(e) {
	// When we receive a message from the server,
	// we show it
	webSocket.addEventListener('message', function(e) {
		textarea.value += e.data + "\n";
	});

	// We send all messages to the server
	input.addEventListener('change', function(e) {
		webSocket.send(`${name}: ${input.value}`);
		input.value = "";
	});
});
