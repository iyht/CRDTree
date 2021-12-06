import http from "http";
import express from "express";
import WebSocket from "ws";

const app = express();
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({server});

const logging = (req, res, next) => {
	const start: number = Date.now();
	res.on("finish", () => {
		const tookMs = Date.now() - start;
		console.info(res.statusCode, req.path, req.method, ':', `${tookMs}ms`);
	});
	next();
};

app.use(express.static('public'));
app.use(logging);

webSocketServer.on('connection', (webSocket: WebSocket) => {
	// send all known data up
	webSocket.send("everything we know so far");

	webSocket.on('message', (data) => {
		console.log(data.toString());
		// commit local change
		// send all known data up
		webSocketServer.clients.forEach(function (client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	});
});

const onReceiveChange = (data) => {
	webSocketServer.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};

const port = process.env.PORT || 1234;
server.listen(port, () => console.log("server started on", port));
