import Libp2p from "libp2p";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {ProtocolType} from "./ProtocolType";

const PROTOCOL_PREFIX = "/crdtree/basic";

const addBasicProtocol = (node: Libp2p, crdt: ConnectedCRDTree): void => {
	// node.handle(PROTOCOL_PREFIX, handle(crdt));
	// crdt.setProtocol(protocol, ProtocolType.BASIC);
};

export {addBasicProtocol};
