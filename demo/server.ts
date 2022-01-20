import http from "http";
import express from "express";
import WebSocket from "ws";
import {debounce} from "debounce";

import {IConnectedCRDTree} from "network/dist/src/ConnectedCRDTree";
import {initNetwork, connectTo} from "network/dist/src/Network";
import {ICRDTree} from "crdtree/src";
import open from "open";
import {render} from "crdtree/dist/src/Renderer";

const app = express();
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({server});

let crdt: IConnectedCRDTree = null;

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

	webSocket.on("close", () => {
		if (webSocketServer.clients.size === 0) {
			process.exit(0);
		}
	});

	webSocket.send(JSON.stringify({
		render: crdt?.render,
		addresses: crdt?.addresses,
		name: crdt?.render.names[crdt.id],
		branches: crdt?.listRefs(),
		ref: crdt?.ref
	}));

	webSocket.on('message', async (data) => {
		const message = JSON.parse(data.toString());
		if (message.kind === "start") {
			crdt = await initNetwork();
			crdt.onUpdate(() => send(crdt));
			bootstrap(crdt);
			setName(crdt, crdt.id, crdt.id.slice(-7));
		} else if (message.kind === "connect") {
			const address = message.data;
			crdt = await connectTo([address]);
			crdt.onUpdate(() => send(crdt));
			setName(crdt, crdt.id, crdt.id.slice(-7));
		} else if (message.kind === "rename") {
			setName(crdt, crdt.id, message.data);
		} else if (message.kind === "message") {
			addMessage(crdt, crdt.id, message.data);
		} else if (message.kind === "fork") {
			crdt.fork();
		} else if (message.kind === "checkout") {
			const branch = message.data;
			crdt.checkout(branch);
			send(crdt)
		}
	});
});

const addMessage = (crdt: ICRDTree, id: string, message: string) => {
	const index = crdt.render.messages.length;
	crdt.insert(["messages", index], {});
	crdt.assign(["messages", index, "from"], id);
	crdt.assign(["messages", index, "content"], message);
};

const setName = (crdt: ICRDTree, id: string, name: string) => {
	crdt.assign(["names", id], name);
};

const bootstrap = (crdt: ICRDTree) => {
	crdt.assign([], {});
	crdt.assign(["names"], {});
	crdt.assign(["messages"], []);
};

const send = debounce((crdt) => {
	const data = {render: crdt.render, addresses: crdt.addresses,
		name: crdt.render.names[crdt.id], branches: crdt.listRefs(), ref: crdt.ref}
	webSocketServer.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(data));
		}
	});
}, 50);

const port = process.env.PORT || 1234;
server.listen(port, () => {
	console.log("server started on", port);
	return open(`http://localhost:${port}`);
});
