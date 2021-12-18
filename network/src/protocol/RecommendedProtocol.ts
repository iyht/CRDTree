import Libp2p from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {Protocol, ProtocolKind} from "./Protocol";
import {addSpecificProtocol, handle, send} from "./Common";

const PROTOCOL_PREFIX = "/crdtree/rec";

const protocol: Protocol = {
	kind: ProtocolKind.RECOMMENDED,
	broadcast: async (node: Libp2p, updates: any): Promise<void> => {
		node.peerStore.peers.forEach((peer) => {
			node.connectionManager.get(peer.id)?.newStream([PROTOCOL_PREFIX])
				.then(send(updates));
		});
	},
	listRefs(): string[] {
		return [];
	},
	subscribe(ref: string): Promise<void> {
		return Promise.resolve(undefined);
	}
};

const addRecommendedProtocol = addSpecificProtocol(PROTOCOL_PREFIX, protocol);

export {addRecommendedProtocol};
