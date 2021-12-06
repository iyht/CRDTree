import {ICRDTree} from "crdtree";
import * as p2p from "./P2P";
import {CRDTreeTransport} from "../../crdtree";
import {debounce} from "debounce";

const idJSON = require('./id.json')

type ipv4addr = [number, string];

export interface INetwork<T = any> {

	// connect to an existing CRDTree network
	// calls itself and may connect to other nodes it learns about from host
	connect(addr: string): Promise<any>;

	createBootstrapNode(): Promise<boolean>;

	assign(indices: Array<number | string>, item: any): void;

	insert(indices: [...Array<number | string>, number], item: any): void;

	delete(indices: Array<number | string>): void;

	render(): any;
}

export class RootNetwork<T = any> implements INetwork<T> {
	private readonly pubsubChat = new p2p.PubsubChat();
	private pendingUpdates: CRDTreeTransport<T>;
	node: any;


	constructor(private readonly crdt: ICRDTree) {
		this.pendingUpdates = [];
		crdt.onUpdate((update) => {
			this.pendingUpdates.push(...update);
			this.broadcast()
		});
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


	get_connected_roots(): ipv4addr[] {
		// TODO
		return;
	}

	connect(addr: string): Promise<any> {
		(async () => {
			this.node = await p2p.createNode(addr);
			console.log(this.node.peerId.toB58String())

			this.node.connectionManager.on('peer:connect', (connection) => {
				// TODO request a complete history
				console.info(`Connected to ${connection.remotePeer.toB58String()}!`)
			})

			// Start libp2p
			await this.node.start()

			// Create our PubsubChat client

			this.pubsubChat.assign(this.node, p2p.PubsubChat.TOPIC, ({from, message}) => {
				let fromMe = from === this.node.peerId.toB58String()
				let user = from.substring(0, 6)
				if (this.pubsubChat.userHandles.has(from)) {
					user = this.pubsubChat.userHandles.get(from)
				}
				console.log("received");
				console.log(message.data);
				this.crdt.merge(JSON.parse(message.data));
				//   console.info(`${fromMe ? p2p.PubsubChat.CLEARLINE : ''}${user}(${new Date(message.created).toLocaleTimeString()}): ${message.data}`)
			})
		})();
		return;
	}

	createBootstrapNode(): Promise<boolean> {
		(async () => {
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
		})()
		return;
	}

	private readonly broadcast: () => void = debounce(async () => {
		const updatesToBroadcast = this.pendingUpdates;
		this.pendingUpdates = [];

		try {
			// Publish the message
			const message = JSON.stringify(updatesToBroadcast);
			const buffer = Buffer.from(message);
			await this.pubsubChat.send(buffer)
		} catch (err) {
			this.pendingUpdates.push(...updatesToBroadcast);
			console.error('Could not publish chat', err)
		}
	}, 200);
}
