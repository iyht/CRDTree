import {CRDTree, ICRDTree} from "crdtree";
import {CRDTreeTransport} from "../../crdtree";
import Libp2p, {Connection} from "libp2p";
import {connectNode, initNode} from "./P2P";
import {IConnectedCRDTree, ConnectedCRDTree} from "./ConnectedCRDTree";

enum ProtocolType {
	BASIC,
	RECOMMENDED,
}

async function initNetwork(from: CRDTreeTransport<unknown> = [],
						   protocol: ProtocolType = ProtocolType.BASIC): Promise<IConnectedCRDTree> {

	const node = await initNode();

	node.connectionManager.on('peer:connect', (connection: Connection) => {
		console.info(`${node.peerId.toB58String()} connected to ${connection.remotePeer.toB58String()}!`);
	});

	await node.start();
	return new ConnectedCRDTree(node, new CRDTree(from));
}

async function connectTo(knownPeers: string[]): Promise<IConnectedCRDTree> {
	const node = await connectNode(knownPeers);
	const crdt = await new CRDTree();

	node.connectionManager.on('peer:connect', (connection: Connection) => {
		console.info(`${node.peerId.toB58String()} connected to ${connection.remotePeer.toB58String()}!`);
	});

	await new Promise<void>((resolve) => {
		node.connectionManager.once('peer:connect', (connection: Connection) => {
			// TODO query for a full history here
			// connection.
			return resolve();
		});
		return node.start();
	});

	// Create our PubsubChat client
	// this.pubsubChat.assign(this.node, p2p.PubsubChat.TOPIC, ({message}) => {
	// 	console.log("received");
	// 	console.log(message.data);
	// 	this.crdt.merge(JSON.parse(message.data));
	// });
	return new ConnectedCRDTree(node, crdt);
}

export {initNetwork, connectTo};
