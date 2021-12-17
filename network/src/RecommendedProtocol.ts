import pipe from "it-pipe";
import Libp2p, {Connection, MuxedStream} from "libp2p";


const PROTOCOL_PREFIX = "/crdtree/rec";

const handle = (crdt) => async ({stream, protocol}: {stream: MuxedStream, protocol: string}) => {
	const messages = [];
	try {
		await pipe(stream, async (source) => {
			for await (const message of source) {
				crdt.merge(JSON.parse(message.toString()));
			}
		});
		await pipe([], stream);
	} catch (err) {
		// TODO
	}
	return messages;
};

const send = async (message, stream: MuxedStream) => {
	const messages = [];
	try {
		await pipe([message], stream);
	} catch (err) {
		// TODO
	}
	return messages;
};

const protocol = async (node: Libp2p, updates: any): Promise<void> => {
	const message = JSON.stringify(updates);
	const buffer = Buffer.from(message);
	node.peerStore.peers.forEach((peer) => {
		node.connectionManager.get(peer.id)?.newStream([PROTOCOL_PREFIX])
			.then(({stream}) => send(buffer, stream));
	});
};

export {PROTOCOL_PREFIX, send, handle, protocol};
