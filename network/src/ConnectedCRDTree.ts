import {CRDTreeTransport} from "../../crdtree";
import Libp2p from "libp2p";
import {ICRDTree} from "crdtree";
import {debounce} from "debounce";

interface IConnectedCRDTree<T = any> {

	addresses: string[];

	assign(indices: Array<number | string>, item: any): void;

	insert(indices: [...Array<number | string>, number], item: any): void;

	delete(indices: Array<number | string>): void;

	onUpdate(callback: (render: any) => void): void;
}

class ConnectedCRDTree<T = any> implements IConnectedCRDTree<T> {
	private pendingUpdates: CRDTreeTransport<T>;

	constructor(private readonly node: Libp2p, private readonly crdt: ICRDTree) {
		this.pendingUpdates = [];
		this.crdt.onUpdate((update) => {
			this.pendingUpdates.push(...update);
			this.broadcast();
		});
	}

	public get addresses(): string[] {
		const peerId = this.node.peerId.toB58String();
		return this.node.transportManager.getAddrs()
			.map((addr) => `${addr.toString()}/p2p/${peerId}`);
	}

	public assign(indices: Array<number | string>, item: any): void {
		this.crdt.assign(indices, item);
	}

	public insert(indices: [...Array<number | string>, number], item: any): void {
		this.crdt.insert(indices, item);
	}

	public delete(indices: Array<number | string>): void {
		this.crdt.delete(indices);
	}

	public render(): any {
		return this.crdt.render();
	}

	public onUpdate(callback: (render: any) => void): void {
		// TODO
	}

	/*
	async createBootstrapNode(): Promise<void> {
		const peerId = await p2p.PeerId.createFromJSON(idJSON)

		// Wildcard listen on TCP and Websocket
		const addrs = [
			'/ip4/0.0.0.0/tcp/63785',
			'/ip4/0.0.0.0/tcp/63786/ws'
		]

		const signalingServer = await p2p.SignalingServer.start({
			port: 15555
		})
		const ssAddr = `/ip4/${signalingServer.info.host}/tcp/${signalingServer.info.port}/ws/p2p-webrtc-star`
		console.info(`Signaling server running at ${ssAddr}`)
		addrs.push(`${ssAddr}/p2p/${peerId.toB58String()}`)

		// Create the node
		this.node = await p2p.createBootstrapNode(peerId, addrs)

		// Set up our input handler
		process.stdin.on('data', (message) => {
			// remove the newline
			message = message.slice(0, -1)
			// Iterate over all peers, and send messages to peers we are connected to
			this.node.peerStore.peers.forEach(async (peerData) => {
				// If they dont support the chat protocol, ignore
				// if (!peerData.protocols.includes(ChatProtocol.PROTOCOL)) return

				// If we're not connected, ignore
				const connection = this.node.connectionManager.get(peerData.id)
				if (!connection) return

				// try {
				//   const { stream } = await connection.newStream([ChatProtocol.PROTOCOL])
				//   await ChatProtocol.send(message, stream)
				// } catch (err) {
				//   console.error('Could not negotiate chat protocol stream with peer', err)
				// }
			})
		})

		// Start the node
		await this.node.start()
		console.log('Node started with addresses:')
		this.node.transportManager.getAddrs().forEach(ma => console.log(ma.toString()))
		console.log(this.node.peerId.toB58String())
		console.log('\nNode supports protocols:')
		this.node.upgrader.protocols.forEach((_, p) => console.log(p))
	}
	 */

	private readonly broadcast: () => void = debounce(async () => {
		const updatesToBroadcast = this.pendingUpdates;
		this.pendingUpdates = [];

		try {
			// Publish the message
			const message = JSON.stringify(updatesToBroadcast);
			const buffer = Buffer.from(message);
			// await this.pubsubChat.send(buffer);
		} catch (err) {
			this.pendingUpdates.push(...updatesToBroadcast); // hopefully will get handled later
			console.warn("Updates couldn't get published. Will publish later. Reason:", err);
		}
	}, 200);
}

export {IConnectedCRDTree, ConnectedCRDTree}
