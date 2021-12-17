import {CRDTree, ICRDTree, CRDTreeTransport} from "crdtree";

import Libp2p, {Connection} from "libp2p";
import {NOISE} from "libp2p-noise";
import TCP from "libp2p-tcp";
import MPLEX from "libp2p-mplex";
import MulticastDNS from "libp2p-mdns";
import Bootstrap from "libp2p-bootstrap";

import {IConnectedCRDTree, ConnectedCRDTree} from "./ConnectedCRDTree";

enum ProtocolType {
	BASIC,
	RECOMMENDED,
}

const newNode = (knownPeers: string[] = []): Promise<Libp2p> =>
	Libp2p.create({
		addresses: {
			listen: [
				'/ip4/0.0.0.0/tcp/0',
				'/ip4/0.0.0.0/tcp/0/ws',
			]
		},
		modules: {
			transport: [TCP],
			streamMuxer: [MPLEX],
			connEncryption: [NOISE],
			peerDiscovery: knownPeers.length === 0 ? [MulticastDNS] : [Bootstrap, MulticastDNS],
		},
		config: {
			peerDiscovery: {
				autoDial: true,
				[MulticastDNS.tag]: {
					interval: 1000,
					enabled: true,
				},
				[Bootstrap.tag]: knownPeers.length === 0 ? undefined : {
					list: knownPeers,
					interval: 2000,
					enabled: true,
				}
			}
		}
	});

const initNetwork = async (from: CRDTreeTransport<unknown> = [],
						   protocol: ProtocolType = ProtocolType.BASIC): Promise<IConnectedCRDTree> => {
	const node = await newNode();
	await node.start();
	return new ConnectedCRDTree(node, new CRDTree(from));
};

const bootstrapCRDTree = (crdt: ICRDTree, node: Libp2p): Promise<{ crdt: ICRDTree, node: Libp2p }> =>
	new Promise((resolve) => {
		node.connectionManager.once('peer:connect', (connection: Connection) => {
			// TODO query for a full history here
			// const history = await connection.bootstrap(); // TODO
			// crdt.merge(history); // TODO
			return resolve({node, crdt});
		});
		return node.start();
	});

const connectTo = async (knownPeers: string[]): Promise<IConnectedCRDTree> => {
	const {crdt, node} = await bootstrapCRDTree(new CRDTree(), await newNode(knownPeers));
	return new ConnectedCRDTree(node, crdt);
};

export {initNetwork, connectTo};
