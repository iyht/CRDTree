import {ProtocolKind} from "./Protocol";
import Libp2p from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {addRecommendedProtocol} from "./RecommendedProtocol";
import {addBasicProtocol} from "./BasicProtocol";

const addProtocol = (type: ProtocolKind, node: Libp2p, crdt: ConnectedCRDTree) => {
	if (type === ProtocolKind.RECOMMENDED) {
		addRecommendedProtocol(node, crdt);
	} else {
		addBasicProtocol(node, crdt);
	}
};

export {addProtocol};
