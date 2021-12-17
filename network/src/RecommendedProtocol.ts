import pipe from "it-pipe";
import {Connection, MuxedStream} from "libp2p";


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

export {PROTOCOL_PREFIX, send, handle};
