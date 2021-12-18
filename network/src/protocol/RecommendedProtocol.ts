import Libp2p from "libp2p";
import {Protocol, ProtocolKind} from "./Protocol";
import {addSpecificProtocol, handle, send} from "./Common";
import {CRDTree, CRDTreeTransport, ICRDTree} from "crdtree";
import {ActionKind, Join} from "crdtree/dist/src/Action";
import {ConnectedCRDTree} from "../ConnectedCRDTree";
import {BackendChange} from "crdtree/dist/src/Change";
import {nameLt} from "crdtree/dist/src/Clock";
import {ID} from "crdtree/dist/src/API";
import {ROOT} from "crdtree/dist/src/Constants";
import {requestHistoryAgain} from "./QueryProtocol";
import {Multiaddr} from "multiaddr";
import PeerId from "peer-id";

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

const addSubscriber = (node: Libp2p, id: string, ref: string, meta: ICRDTree) => {
	const render = ensureSubscribersObjectForRef(ref, meta);
	if (!render.subscribers[ref].ids[id]) {
		const otherSubs = Object.keys(render.subscribers[ref].ids);
		render.subscribers[ref].ids[id] = true;
		meta.assign(["subscribers", ref, "ids", id], render.subscribers[ref].ids[id]);
		if (otherSubs.length > 0) { // deffo a checkout
			requestHistoryAgain(node, ref, otherSubs);
		}
		// else deffo fork or a side-channel checkout and we're not up to date yet
		// TODO really there should be a different function for the other case (a fork, rather than a checkout)
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
	if (join.after) {
		const render = ensureSubscribersObjectForRef(originator, meta);
		if (!render.subscribers[originator].joins[joinedInto] ||
			(render.subscribers[originator].joins[joinedInto] !== after &&
				nameLt(render.subscribers[originator].joins[joinedInto], after))) {
			render.subscribers[originator].joins[joinedInto] = after;
			meta.assign(["subscribers", originator, "joins", joinedInto], render.subscribers[originator].joins[joinedInto]);
		}
	}
};

const saveJoins = (update: CRDTreeTransport<any>, meta: ICRDTree) => {
	const joins = update.filter((change) => change.action.kind === ActionKind.JOIN);
	joins.forEach(saveJoin(meta));
};

const discoverPeers = (node: Libp2p, meta: ICRDTree) => {
	const peerAddresses = Object.entries(meta.render.addresses ?? {});
	for (const [peerId, addresses] of peerAddresses) {
		if (node.peerId.toB58String() !== peerId &&
			!node.peerStore.peers.has(peerId) &&
			(addresses as any).length > 0) {

			node.dial(PeerId.createFromB58String(peerId)).catch(console.warn);
			(addresses as any).forEach((address) => node.dial(new Multiaddr(address) as any).catch(console.warn));
		}
	}
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
		const refs = meta.render?.subscribers ?? {ROOT};
		return Object.keys(refs);
	},
	subscribe(node: Libp2p, id: string, ref: string, meta: ICRDTree): void {
		addSubscriber(node, id, ref, meta);
	},
	saveJoins(update: CRDTreeTransport<unknown>, meta: ICRDTree) {
		saveJoins(update, meta);
	},
	initMeta: (crdt: ConnectedCRDTree, node: Libp2p, history: CRDTreeTransport<any>) => {
		const meta = new CRDTree(history);
		node.handle(META_PREFIX, handle(meta));
		meta.onUpdate((updates) => {
			discoverPeers(node, meta);
			node.peerStore.peers.forEach((peer) => {
				node.connectionManager.get(peer.id)?.newStream([META_PREFIX])
					.then(send(updates));
			});
		});
		const pid = crdt.id;
		const addresses = crdt.addresses;
		addAddresses(pid, addresses, meta);
		addSubscriber(node, pid, ROOT, meta);
		saveJoins(crdt.serialize(), meta);
		return meta;
	},
};

const addRecommendedProtocol = addSpecificProtocol(PROTOCOL_PREFIX, protocol);

export {addRecommendedProtocol};
