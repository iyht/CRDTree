import {ProtocolType} from "./ProtocolType";
import Libp2p from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {addRecommendedProtocol} from "./RecommendedProtocol";
import {addBasicProtocol} from "./BasicProtocol";

const addProtocol = (type: ProtocolType, node: Libp2p, crdt: ConnectedCRDTree) => {
	if (type === ProtocolType.RECOMMENDED) {
		addRecommendedProtocol(node, crdt);
	} else {
		addBasicProtocol(node, crdt);
	}
};

export {addProtocol};
