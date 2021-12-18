import Libp2p from "libp2p";
import {CRDTreeTransport, ICRDTree} from "crdtree";

enum ProtocolKind {
	BASIC = "Basic",
	RECOMMENDED = "Recommended",
}

interface Protocol {
	kind: ProtocolKind;
	broadcast(node: Libp2p, updates: any, meta: ICRDTree): Promise<void>;
	subscribe(ref: string, meta: ICRDTree): Promise<void>;
	listRefs(userCRDT: ICRDTree, meta: ICRDTree): string[];
	initMeta(history: CRDTreeTransport<any>): ICRDTree;
}

const baseProtocol: Protocol = {
	kind: undefined,
	broadcast: () => Promise.resolve(),
	subscribe: () => Promise.resolve(),
	listRefs: () => [],
	initMeta: () => null,
};

export {Protocol, ProtocolKind, baseProtocol};
