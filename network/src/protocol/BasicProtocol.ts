import Libp2p from "libp2p";
import {Protocol, ProtocolKind} from "./Protocol";
import {addSpecificProtocol, send} from "./Common";
import {ICRDTree} from "crdtree";

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
	subscribe: (): void => undefined,
	initMeta: () => null,
	saveJoins: () => undefined,
};

const addBasicProtocol = addSpecificProtocol(PROTOCOL_PREFIX, protocol);

export {addBasicProtocol};
