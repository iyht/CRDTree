const textarea = document.querySelector('textarea');
const input = document.querySelector('#message');
input.disabled = true;
const name = document.querySelector('#name');
const address = document.querySelector('h3');

const webSocket = new WebSocket(`ws://${location.host}`);

const send = (kind, data) => webSocket.send(JSON.stringify({kind, data}));

const renderMessages = (render) =>
	render.messages
		.filter((message) => message.from !== undefined && message.content !== undefined)
		.map((message) => `${render.names[message.from]}: ${message.content}`)
		.join("\n");

webSocket.addEventListener('open', function(e) {
	// When we receive a message from the server,
	// we show it
	webSocket.addEventListener('message', function(e) {
		const data = JSON.parse(e.data.toString());
		if (!data.render) {
			const network = prompt('Know an address?');
			send(network ? "connect" : "start", network);
		} else {
			console.log(data.render);
			name.value = data.name;
			address.textContent = `My address: ${data.addresses.pop()}`;
			textarea.value = renderMessages(data.render);
			input.disabled = !Array.isArray(data.render.messages);
			textarea.scrollTop = textarea.scrollHeight;
		}
	});

	// We send all messages to the server
	input.addEventListener('change', function(e) {
		send("message", input.value);
		input.value = "";
	});

	name.addEventListener('change', function (e) {
		send("rename", name.value);
		name.value = "";
	});
});
