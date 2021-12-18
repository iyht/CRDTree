import Libp2p from "libp2p";
import {CRDTreeTransport, ICRDTree} from "crdtree";
import {ConnectedCRDTree} from "../ConnectedCRDTree";

enum ProtocolKind {
	BASIC = "Basic",
	RECOMMENDED = "Recommended",
}

interface Protocol {
	kind: ProtocolKind;
	broadcast(node: Libp2p, updates: any, meta: ICRDTree): Promise<void>;
	subscribe(node: Libp2p, id: string, ref: string, meta: ICRDTree): void;
	listRefs(userCRDT: ICRDTree, meta: ICRDTree): string[];
	initMeta(crdt: ConnectedCRDTree, node: Libp2p, history: CRDTreeTransport<any>): ICRDTree;
	saveJoins(update: CRDTreeTransport<unknown>, meta: ICRDTree): void;
}

const baseProtocol: Protocol = {
	kind: undefined,
	broadcast: () => Promise.resolve(),
	subscribe: () => undefined,
	listRefs: (userCRDT: ICRDTree) => userCRDT.listRefs(),
	initMeta: () => null,
	saveJoins: () => undefined,
};

export {Protocol, ProtocolKind, baseProtocol};
