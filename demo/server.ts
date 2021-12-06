import http from "http";
import express from "express";
import WebSocket from "ws";

const app = express();
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({server});

app.use(express.static('public'));

webSocketServer.on('connection', (webSocket: WebSocket) => {
	// send all known data up

	webSocket.on('message', (data) => {
		// commit local change
		// send all known data up
	});
});

const onReceiveChange = (data) => {
	webSocketServer.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};

server.listen(process.env.PORT);
