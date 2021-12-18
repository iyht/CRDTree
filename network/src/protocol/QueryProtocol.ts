import Libp2p, {Connection, HandlerProps, MuxedStream} from "libp2p";
import pipe from "it-pipe";
import {ProtocolType} from "./ProtocolType";
import {CRDTreeTransport} from "crdtree";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {addProtocol} from "./addProtocol";

const PROTOCOL_PREFIX = "/crdtree/query";

enum QueryKind {
	BOOTSTRAP_REQ = "bootstrap-request",
	BOOTSTRAP_RES = "bootstrap-response",
}

interface QueryMessage {
	kind: QueryKind;
	protocol?: ProtocolType;
	history?: CRDTreeTransport<unknown>;
}

const requestHistory = (connection: Connection) => {
	const message = {kind: QueryKind.BOOTSTRAP_REQ};
	connection.newStream([PROTOCOL_PREFIX]).then(({stream}) => send(message, stream));
};

const requestHistoryAgain = (node: Libp2p) => {
	const peers = Array.from(node.peerStore.peers.values());
	const peer = peers[Math.floor(Math.random() * peers.length)];
	if (peer.protocols.includes(PROTOCOL_PREFIX)) {
		const connection = node.connectionManager.get(peer.id);
		if (connection) {
			return requestHistory(connection);
		}
	}
	return requestHistoryAgain(node);

};

const handleRequest = (crdt: ConnectedCRDTree) =>
	async ({stream, connection}: HandlerProps) => {
		await pipe(stream, async (source) => {
			for await (const message of source) {
				const query: QueryMessage = JSON.parse(message.toString());
				if (query.kind === QueryKind.BOOTSTRAP_REQ) {
					const queryMessage: QueryMessage = {
						kind: QueryKind.BOOTSTRAP_RES,
						protocol: crdt.getProtocolType(),
						history: crdt.serialize(),
					};
					connection.newStream([PROTOCOL_PREFIX]).then(({stream}) => send(queryMessage, stream));
				}
			}
		});
		await pipe([], stream);
	};

const handleResponse = (node: Libp2p, crdt: ConnectedCRDTree, resolve) =>
	async ({stream, connection}: HandlerProps) => {
		await pipe(stream, async (source) => {
			for await (const message of source) {
				const query: QueryMessage = JSON.parse(message.toString());
				if (query.kind === QueryKind.BOOTSTRAP_RES) {
					const {protocol, history} = query;
					if (protocol === undefined) {
						if (crdt.getProtocolType() === undefined) {
							requestHistoryAgain(node);
						}
					} else {
						addProtocol(protocol, node, crdt);
						crdt.merge(history ?? []);
						resolve();
					}
				} else {
					connection.newStream([PROTOCOL_PREFIX]).then(({stream}) =>
						send({kind: QueryKind.BOOTSTRAP_RES}, stream));
				}
			}
		});
		await pipe([], stream);
	};

const send = (message: QueryMessage, stream: MuxedStream) =>
	pipe([Buffer.from(JSON.stringify(message))], stream);

const addQueryProtocol = (node: Libp2p, crdt: ConnectedCRDTree): void =>
	node.handle(PROTOCOL_PREFIX, handleRequest(crdt));

const bootstrap = async (node: Libp2p, crdt: ConnectedCRDTree, connection: Connection): Promise<void> =>
	new Promise((resolve) => {
		const handler = handleResponse(node, crdt, () => {
			node.unhandle(PROTOCOL_PREFIX);
			addQueryProtocol(node, crdt);
			resolve();
		});
		node.handle(PROTOCOL_PREFIX, handler);
		requestHistory(connection);
	});

export {addQueryProtocol, bootstrap};
