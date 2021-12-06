const Libp2p = require('libp2p')
// dependency for transport
const TCP = require('libp2p-tcp') // allow us talk to other server nodes
const Websockets = require('libp2p-websockets') // allow us to talk to bootstrap nodes(contains SSL)
const WebRTCStar = require('libp2p-webrtc-star') // talk over browsers
const wrtc = require('wrtc') // WebRTC in js
const {NOISE} = require('libp2p-noise') // connection encryption
const Mplex = require('libp2p-mplex') // stream multiplexing for reusing connection
const MulticastDNS = require('libp2p-mdns')
const WebrtcStar = require('libp2p-webrtc-star')
const SignalingServer = require('libp2p-webrtc-star/src/sig-server')
const PeerId = require('peer-id')
const PubsubChat = require('../ext/chat')

// peer discover
const KademliaDHT = require('libp2p-kad-dht')
const Bootstrap = require('libp2p-bootstrap')
const MDNS = require('libp2p-mdns')
const KadDHT = require('libp2p-kad-dht')
// pubsub
const Gossipsub = require('libp2p-gossipsub')

const createNode = async (bootstrapHost = null) => {
	const node = Libp2p.create({
		addresses: {
			listen: [
				'/ip4/0.0.0.0/tcp/0',
				'/ip4/0.0.0.0/tcp/0/ws',
				`/ip4/127.0.0.1/tcp/15555/ws/p2p-webrtc-star/`
			] // assign any port available locally
		},
		modules: {
			transport: [TCP, Websockets, WebrtcStar],
			streamMuxer: [Mplex],
			connEncryption: [NOISE],
			peerDiscovery: [Bootstrap, MDNS],
			dht: KadDHT,
			pubsub: Gossipsub
		},
		config: {
			transport: {
				[WebrtcStar.prototype[Symbol.toStringTag]]: {
					wrtc
				}
			},
			peerDiscovery: {
				bootstrap: {
					list: [bootstrapHost]
				}
			},
			dht: {
				enabled: true,
				randomWalk: {
					enabled: true
				}
			}
		}
	})

	return node
}


const createBootstrapNode = (peerId, listenAddrs) => {
	return Libp2p.create({
		peerId,
		addresses: {
			listen: listenAddrs
		},
		modules: {
			transport: [WebrtcStar, TCP, Websockets],
			streamMuxer: [Mplex],
			connEncryption: [NOISE],
			peerDiscovery: [MDNS],
			dht: KademliaDHT,
			pubsub: Gossipsub
		},
		config: {
			transport: {
				[WebrtcStar.prototype[Symbol.toStringTag]]: {
					wrtc
				}
			},
			relay: {
				enabled: true,
				hop: {
					enabled: true,
					active: false
				}
			},
			dht: {
				enabled: true,
				randomWalk: {
					enabled: true
				}
			}
		}
	})
}


export {createNode, createBootstrapNode, SignalingServer, PeerId, PubsubChat};
