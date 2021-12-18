import Libp2p from "libp2p";
import {ICRDTree} from "crdtree";

enum ProtocolKind {
	BASIC = "Basic",
	RECOMMENDED = "Recommended",
}

interface Protocol {
	kind: ProtocolKind;
	broadcast(node: Libp2p, updates: any): Promise<void>;
	subscribe(ref: string): Promise<void>;
	listRefs(userCRDT: ICRDTree, meta: ICRDTree): string[];
}

const baseProtocol: Protocol = {
	kind: undefined,
	broadcast: () => Promise.resolve(),
	subscribe: () => Promise.resolve(),
	listRefs: () => [],
};

export {Protocol, ProtocolKind, baseProtocol};
