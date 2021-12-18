import Libp2p from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {Protocol, ProtocolKind} from "./Protocol";
import {addSpecificProtocol, handle, send} from "./Common";
import {CRDTree, CRDTreeTransport, ICRDTree} from "crdtree";

const PROTOCOL_PREFIX = "/crdtree/bas";

const protocol: Protocol = {
	kind: ProtocolKind.BASIC,
	broadcast: async (node: Libp2p, updates: any): Promise<void> => {
		node.peerStore.peers.forEach((peer) => {
			node.connectionManager.get(peer.id)?.newStream([PROTOCOL_PREFIX])
				.then(send(updates));
		});
	},
	listRefs: (userCRDT: ICRDTree): string[] => userCRDT.listRefs(),
	subscribe: (): Promise<void> => Promise.resolve(),
	initMeta: () => null,
};

const addBasicProtocol = addSpecificProtocol(PROTOCOL_PREFIX, protocol);

export {addBasicProtocol};
