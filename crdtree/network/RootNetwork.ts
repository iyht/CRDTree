import {CRDTreeTransport} from "../src/API";
import { CRDTree } from "../src/CRDTree";
import {ICRDTree} from "../src/API";
import * as p2p from "./P2P";
const idJSON = require('./id.json')

type ipv4addr = [number, string];


export interface INetwork<T = any> {

	// connect to an existing CRDTree network
	// calls itself and may connect to other nodes it learns about from host
	connect(addr: string) : Promise<any>;

	createBootstrapNode(): Promise<boolean>;

	get_connected_roots(): ipv4addr[];

	encode(crdt: ICRDTree): string;

	decode(msg: string): CRDTree;

	// called by CRDTree to propagate to other processes
	send(crdt: ICRDTree): void;

	// when receiving an update, calls callback to let CRDTree handle it
	onRecv(callback: (update: CRDTreeTransport<T>) => void): void;
}

export class RootNetwork<T = any> implements INetwork<T> {
	tmp_trans: CRDTreeTransport<T>;
  	pubsubChat = new p2p.PubsubChat();



	constructor() {
		// set up server using port given


		// receive a connection to an existing CRDTree network
		// after establishing the socket, replies back all known nodes
		// may learn about new nodes from connecting node
	}
	encode(crdt: ICRDTree): string{
		return JSON.stringify(crdt.serialize());
	}

	decode(changes: string): any{
		return JSON.parse(changes);
	}


	get_connected_roots(): ipv4addr[]{
		return;
	}

	connect(addr:string): Promise<any>{
		;(async () => {
			const libp2p = await p2p.createNode(addr);
			// libp2p.on('peer:discovery', (peerId) => console.log('Discovered:', peerId.toB58String()))
			console.log(libp2p.peerId.toB58String())
		
			// Listen on libp2p for `peer:connect` and log the provided connection.remotePeer.toB58String() peer id string.
			libp2p.connectionManager.on('peer:connect', (connection) => {
			  console.info(`Connected to ${connection.remotePeer.toB58String()}!`)
			})
		
			// Start libp2p
			await libp2p.start()
		
			// TODO: CRDT client command handler 
			  // Create our PubsubChat client
  			this.pubsubChat.assign(libp2p, p2p.PubsubChat.TOPIC, ({ from, message }) => {
  			  let fromMe = from === libp2p.peerId.toB58String()
  			  let user = from.substring(0, 6)
  			  if (this.pubsubChat.userHandles.has(from)) {
  			    user = this.pubsubChat.userHandles.get(from)
  			  }
  			  console.info(`${fromMe ? p2p.PubsubChat.CLEARLINE : ''}${user}(${new Date(message.created).toLocaleTimeString()}): ${message.data}`)
  			})

  			// Set up our input handler
  			process.stdin.on('data', async (message) => {
  			  // Remove trailing newline
  			  message = message.slice(0, -1)
  			  // If there was a command, exit early
  			  if (this.pubsubChat.checkCommand(message)) return

  			  try {
  			    // Publish the message
  			    await this.pubsubChat.send(message)
  			  } catch (err) {
  			    console.error('Could not publish chat', err)
  			  }
  			})
		
		})()
		return;
	}

	createBootstrapNode(): Promise<boolean>{
		;(async () => {
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
			const libp2p = await p2p.createBootstrapNode(peerId, addrs)
			// const libp2p = await p2p.createBootstrapNode()
		  
			// Add chat handler
			// libp2p.handle(ChatProtocol.PROTOCOL, ChatProtocol.handler)
		  
			// Set up our input handler
			process.stdin.on('data', (message) => {
			  // remove the newline
			  message = message.slice(0, -1)
			  // Iterate over all peers, and send messages to peers we are connected to
			  libp2p.peerStore.peers.forEach(async (peerData) => {
				// If they dont support the chat protocol, ignore
				// if (!peerData.protocols.includes(ChatProtocol.PROTOCOL)) return
		  
				// If we're not connected, ignore
				const connection = libp2p.connectionManager.get(peerData.id)
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
			await libp2p.start()
			console.log('Node started with addresses:')
			libp2p.transportManager.getAddrs().forEach(ma => console.log(ma.toString()))
			console.log(libp2p.peerId.toB58String())
			console.log('\nNode supports protocols:')
			libp2p.upgrader.protocols.forEach((_, p) => console.log(p))
		  })()
		return;
	}

	send(crdt: ICRDTree): void {
		;(async () => {
			let msg: string = this.encode(crdt);
			let buf: Buffer = Buffer.from(msg);
			buf = buf.slice(0, -1)
			// this.pubsubChat.send(msg);
			if (this.pubsubChat.checkCommand(buf)) return

			try {
			  // Publish the message
			  await this.pubsubChat.send(buf)
			} catch (err) {
			  console.error('Could not publish chat', err)
			}
		})();
	}

	onRecv(callback: <T>(update: CRDTreeTransport<T>) => void): void {
		return;
	}
}
