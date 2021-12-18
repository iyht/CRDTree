import {ProtocolKind} from "./Protocol";
import Libp2p from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {addRecommendedProtocol} from "./RecommendedProtocol";
import {addBasicProtocol} from "./BasicProtocol";
import {CRDTreeTransport} from "crdtree";

const addProtocol =
	(type: ProtocolKind, node: Libp2p, crdt: ConnectedCRDTree, metaHistory: CRDTreeTransport<unknown>) => {
		if (type === ProtocolKind.RECOMMENDED) {
			addRecommendedProtocol(node, crdt, metaHistory);
		} else {
			addBasicProtocol(node, crdt, undefined);
		}
	};

export {addProtocol};
