import Libp2p, {Connection, HandlerProps, MuxedStream} from "libp2p";
import pipe from "it-pipe";
import {ProtocolKind} from "./Protocol";
import {CRDTreeTransport} from "crdtree";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {addProtocol} from "./addProtocol";
import {ROOT} from "crdtree/dist/src/Constants";

const PROTOCOL_PREFIX = "/crdtree/query";

enum QueryKind {
	BOOTSTRAP_REQ = "bootstrap-request",
	BOOTSTRAP_RES = "bootstrap-response",
}

interface QueryMessage {
	kind: QueryKind;
	branch?: string;
	protocol?: ProtocolKind;
	history?: CRDTreeTransport<unknown>;
	metaHistory?: CRDTreeTransport<unknown>;
}

const requestHistory = (connection: Connection, branch?: string) => {
	branch ??= ROOT;
	const message = {kind: QueryKind.BOOTSTRAP_REQ, branch};
	connection.newStream([PROTOCOL_PREFIX]).then(({stream}) => send(message, stream));
};

const requestHistoryAgain = (node: Libp2p, branch?: string, otherSubs: string[] = []) => {
	const peers = Array.from(node.peerStore.peers.values());
	const peer = peers[Math.floor(Math.random() * peers.length)];
	if (peer.protocols.includes(PROTOCOL_PREFIX) &&
		(otherSubs.length === 0 || otherSubs.includes(peer.id.toB58String()))) {

		const connection = node.connectionManager.get(peer.id);
		if (connection) {
			return requestHistory(connection, branch);
		}
	}
	return requestHistoryAgain(node, branch, otherSubs);
};

const handleQueryAfterBootstrapped = (crdt: ConnectedCRDTree) =>
	async ({stream, connection}: HandlerProps) => {
		await pipe(stream, async (source) => {
			for await (const message of source) {
				const query: QueryMessage = JSON.parse(message.toString());
				if (query.kind === QueryKind.BOOTSTRAP_REQ) {
					const queryMessage: QueryMessage = {
						kind: QueryKind.BOOTSTRAP_RES,
						protocol: crdt.protocolKind,
						history: crdt.serialize(query.branch),
						metaHistory: crdt.serializeProtocol(),
					};
					connection.newStream([PROTOCOL_PREFIX]).then(({stream}) => send(queryMessage, stream));
				} else {
					crdt.merge(query?.history ?? []);
				}
			}
		});
		await pipe([], stream);
	};

const handleQueryBeforeBootstrapped = (node: Libp2p, crdt: ConnectedCRDTree, resolve) =>
	async ({stream, connection}: HandlerProps) => {
		await pipe(stream, async (source) => {
			for await (const message of source) {
				const query: QueryMessage = JSON.parse(message.toString());
				if (query.kind === QueryKind.BOOTSTRAP_RES) {
					const {protocol, history, metaHistory} = query;
					if (protocol === undefined) {
						if (crdt.protocolKind === undefined) {
							requestHistoryAgain(node);
						}
					} else {
						crdt.merge(history ?? []);
						addProtocol(protocol, node, crdt, metaHistory);
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
	node.handle(PROTOCOL_PREFIX, handleQueryAfterBootstrapped(crdt));

const bootstrap = async (node: Libp2p, crdt: ConnectedCRDTree, connection: Connection): Promise<void> =>
	new Promise((resolve) => {
		const handler = handleQueryBeforeBootstrapped(node, crdt, () => {
			node.unhandle(PROTOCOL_PREFIX);
			addQueryProtocol(node, crdt);
			resolve();
		});
		node.handle(PROTOCOL_PREFIX, handler);
		requestHistory(connection);
	});

export {addQueryProtocol, bootstrap, requestHistoryAgain};
