import Libp2p from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {Protocol, ProtocolKind} from "./Protocol";
import {addSpecificProtocol, handle, send} from "./Common";
import {CRDTree, CRDTreeTransport, ICRDTree} from "crdtree";

const PROTOCOL_PREFIX = "/crdtree/rec";

const protocol: Protocol = {
	kind: ProtocolKind.RECOMMENDED,
	broadcast: async (node: Libp2p, updates: any): Promise<void> => {
		node.peerStore.peers.forEach((peer) => {
			node.connectionManager.get(peer.id)?.newStream([PROTOCOL_PREFIX])
				.then(send(updates));
		});
	},
	listRefs(userCRDT: ICRDTree, meta: ICRDTree): string[] {
		return [];
	},
	subscribe(ref: string): Promise<void> {
		return Promise.resolve(undefined);
	},
	initMeta: (history: CRDTreeTransport<any>) => {
		return new CRDTree(history);
	},
};

const addRecommendedProtocol = addSpecificProtocol(PROTOCOL_PREFIX, protocol);

export {addRecommendedProtocol};
