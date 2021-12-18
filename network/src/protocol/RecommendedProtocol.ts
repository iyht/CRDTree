import pipe from "it-pipe";
import Libp2p, {MuxedStream} from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {ProtocolType} from "./ProtocolType";
import {CRDTreeTransport} from "crdtree";

const PROTOCOL_PREFIX = "/crdtree/rec";

const handle = (crdt: ConnectedCRDTree) => async ({stream}: { stream: MuxedStream }) => {
	await pipe(stream, async (source) => {
		for await (const message of source) {
			crdt.merge(JSON.parse(message.toString()));
		}
	});
	return pipe([], stream); // closes stream?
};

const send = async (updates: CRDTreeTransport<unknown>, stream: MuxedStream) => {
	const message = JSON.stringify(updates);
	const buffer = Buffer.from(message);
	return pipe([buffer], stream);
};

const protocol = async (node: Libp2p, updates: any): Promise<void> => {
	node.peerStore.peers.forEach((peer) => {
		node.connectionManager.get(peer.id)?.newStream([PROTOCOL_PREFIX])
			.then(({stream}) => send(updates, stream));
	});
};

const addRecommendedProtocol = (node: Libp2p, crdt: ConnectedCRDTree): void => {
	node.handle(PROTOCOL_PREFIX, handle(crdt));
	crdt.setProtocol(protocol, ProtocolType.RECOMMENDED);
};

export {addRecommendedProtocol};
