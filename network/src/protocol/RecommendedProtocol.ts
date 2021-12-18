import Libp2p from "libp2p";
import {Protocol, ProtocolKind} from "./Protocol";
import {addSpecificProtocol, handle, send} from "./Common";
import {CRDTree, CRDTreeTransport, ICRDTree} from "crdtree";
import {ActionKind, Join} from "crdtree/dist/src/Action";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {BackendChange} from "crdtree/dist/src/Change";
import {nameLt} from "crdtree/dist/src/Clock";
import {ID} from "crdtree/dist/src/API";

const PROTOCOL_PREFIX = "/crdtree/rec";
const META_PREFIX = "/crdtree/meta";

const getSubscribers = (data: any, branch: string, operation: BackendChange): Set<string> => {
	const {ids, joins} = (data[branch] ?? {});
	const subscribers = new Set<string>(Object.keys(ids) ?? []);
	for (const [joinedInto, point] of Object.entries(joins ?? {})) {
		if (operation.pid !== point && nameLt(operation.pid as ID, point as ID)) {
			getSubscribers(data, joinedInto, operation).forEach((sub) => subscribers.add(sub));
		}
	}
	return subscribers;
}


const ensureSubscribersObjectForRef = (ref: string, meta: ICRDTree) => {
	let render = meta.render;
	if (!render) {
		render = {};
		meta.assign([], render);
	}
	if (!render.subscribers) {
		render.subscribers = {};
		meta.assign(["subscribers"], render.subscribers);
	}
	if (!render.subscribers[ref]) {
		render.subscribers[ref] = {};
		meta.assign(["subscribers", ref], render.subscribers[ref]);
		render.subscribers[ref].ids = {};
		meta.assign(["subscribers", ref, "ids"], render.subscribers[ref].ids);
		render.subscribers[ref].joins = {};
		meta.assign(["subscribers", ref, "joins"], render.subscribers[ref].joins);
	}
	return render;
}

const addSubscriber = (id: string, ref: string, meta: ICRDTree) => {
	const render = ensureSubscribersObjectForRef(ref, meta);
	if (!render.subscribers[ref].ids[id]) {
		render.subscribers[ref].ids[id] = true;
		meta.assign(["subscribers", ref, "ids", id], render.subscribers[ref].ids[id]);
	}
};

const addAddresses = (id: string, addresses: string[], meta: ICRDTree): void => {
	let render = meta.render;
	if (!render) {
		render = {};
		meta.assign([], render);
	}
	if (!render.addresses) {
		render.addresses = {};
		meta.assign(["addresses"], render.addresses);
	}
	meta.assign(["addresses", id], []);
	addresses.forEach((address, index) =>
		meta.insert(["addresses", id, index], address));
};

const saveJoin = (meta: ICRDTree) => (change: BackendChange) => {
	const joinedInto = change.branch;
	const join = change.action as Join;
	const originator = join.from;
	const after = join.after;
	const render = ensureSubscribersObjectForRef(originator, meta);
	if (!render.subscribers[originator].joins[joinedInto] ||
		(render.subscribers[originator].joins[joinedInto] !== after &&
			nameLt(render.subscribers[originator].joins[joinedInto], after))) {
		render.subscribers[originator].joins[joinedInto] = after;
		meta.assign(["subscribers", originator, "joins", after], render.subscribers[originator].joins[after]);
	}
};

const saveJoins = (update: CRDTreeTransport<any>, meta: ICRDTree) => {
	const joins = update.filter((change) => change.action.kind === ActionKind.JOIN);
	joins.forEach(saveJoin(meta));
};

const protocol: Protocol = {
	kind: ProtocolKind.RECOMMENDED,
	broadcast: async (node: Libp2p, updates: CRDTreeTransport<unknown>, meta: ICRDTree): Promise<void> => {
		// TODO clear any pending updates for the meta data
		updates.forEach((update) => {
			const ids = getSubscribers(meta.render?.subscribers ?? {}, update.branch, update);
			ids.forEach((id) => {
				if (node.peerStore.peers.has(id)) {
					const peer = node.peerStore.peers.get(id);
					node.connectionManager.get(peer.id)?.newStream([PROTOCOL_PREFIX])
						.then(send([update]));
				}
			});
		});
	},
	listRefs(_: ICRDTree, meta: ICRDTree): string[] {
		const refs = meta.render?.refs ?? {};
		return Object.keys(refs);
	},
	subscribe(id: string, ref: string, meta: ICRDTree): void {
		addSubscriber(id, ref, meta);
	},
	saveJoins(update: CRDTreeTransport<unknown>, meta: ICRDTree) {
		saveJoins(update, meta);
	},
	initMeta: (crdt: ConnectedCRDTree, node: Libp2p, history: CRDTreeTransport<any>) => {
		const meta = new CRDTree(history);
		node.handle(META_PREFIX, handle(meta));
		meta.onUpdate((updates) => {
			node.peerStore.peers.forEach((peer) => {
				node.connectionManager.get(peer.id)?.newStream([META_PREFIX])
					.then(send(updates));
			});
		});
		const pid = crdt.id;
		const addresses = crdt.addresses;
		addAddresses(pid, addresses, meta);
		crdt.listRefs().forEach((ref) => addSubscriber(pid, ref, meta));
		saveJoins(crdt.serialize(), meta);
		return meta;
	},
};

const addRecommendedProtocol = addSpecificProtocol(PROTOCOL_PREFIX, protocol);

export {addRecommendedProtocol};
