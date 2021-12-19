import {CRDTree, CRDTreeTransport} from "crdtree";

import Libp2p, {Connection} from "libp2p";
import {NOISE} from "libp2p-noise";
import TCP from "libp2p-tcp";
import MPLEX from "libp2p-mplex";
import MulticastDNS from "libp2p-mdns";
import Bootstrap from "libp2p-bootstrap";

import {ConnectedCRDTree, IConnectedCRDTree} from "./ConnectedCRDTree";
import {ProtocolKind} from "./protocol/Protocol";
import {addProtocol} from "./protocol/addProtocol";
import {addQueryProtocol, bootstrap} from "./protocol/QueryProtocol";

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
			peerDiscovery: knownPeers.length === 0 ? [MulticastDNS] : [MulticastDNS], // TODO add back the Bootstrap
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
						   name?: string,
						   protocolKind: ProtocolKind = ProtocolKind.RECOMMENDED): Promise<IConnectedCRDTree> => {
	const node = await newNode();
	const connectedCrdt = new ConnectedCRDTree(node, new CRDTree(from, name));
	addQueryProtocol(node, connectedCrdt);
	addProtocol(protocolKind, node, connectedCrdt, []);
	await node.start();
	return connectedCrdt;
};

const connectTo = async (knownPeers: string[], name?: string): Promise<IConnectedCRDTree> => {
	const crdt = new CRDTree([], name);
	const node = await newNode(knownPeers);
	const connectedCrdt = new ConnectedCRDTree(node, crdt);

	return new Promise((resolve) => {
		node.connectionManager.once('peer:connect', async (connection: Connection) => {
			await bootstrap(node, connectedCrdt, connection);
			return resolve(connectedCrdt);
		});
		return node.start();
	});
};

export {initNetwork, connectTo};
