import {ConnectedCRDTree} from "../ConnectedCRDTree";
import Libp2p, {HandlerProps} from "libp2p";
import pipe from "it-pipe";
import {CRDTreeTransport} from "crdtree";
import {Protocol} from "./Protocol";

const handle = (crdt: ConnectedCRDTree) => async ({stream}: HandlerProps) => {
	await pipe(stream, async (source) => {
		for await (const message of source) {
			crdt.merge(JSON.parse(message.toString()));
		}
	});
	return pipe([], stream); // closes stream?
};

const send = (updates: CRDTreeTransport<unknown>) => async ({stream}: HandlerProps) => {
	const message = JSON.stringify(updates);
	const buffer = Buffer.from(message);
	return pipe([buffer], stream);
};

const addSpecificProtocol = (prefix: string, protocol: Protocol) =>
	(node: Libp2p, crdt: ConnectedCRDTree, metaHistory: CRDTreeTransport<unknown>): void => {
	node.handle(prefix, handle(crdt));
	const meta = protocol.initMeta(metaHistory);
	const main = crdt.ref;
	const refs = crdt.listRefs();
	crdt.setProtocol(protocol, meta);
	for (const ref of refs) {
		crdt.checkout(ref);
	}
	crdt.checkout(main);
};

export {handle, send, addSpecificProtocol};
