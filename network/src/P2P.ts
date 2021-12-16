import Libp2p from "libp2p";
import TCP from "libp2p-tcp"
import MPLEX from "libp2p-mplex"
import {NOISE} from "libp2p-noise"
import MulticastDNS from "libp2p-mdns"
import Bootstrap from "libp2p-bootstrap"

const initNode = (): Promise<Libp2p> => Libp2p.create({
	modules: {
		transport: [TCP],
		streamMuxer: [MPLEX],
		connEncryption: [NOISE],
		peerDiscovery: [MulticastDNS],
	}
});

const connectNode = (knownPeers: string[]): Promise<Libp2p> => Libp2p.create({
	modules: {
		transport: [TCP],
		streamMuxer: [MPLEX],
		connEncryption: [NOISE],
		peerDiscovery: [MulticastDNS, Bootstrap]
	},
	config: {
		peerDiscovery: {
			autoDial: true,
			[MulticastDNS.tag]: {
				interval: 1000,
				enabled: true
			},
			[Bootstrap.tag]: {
				list: knownPeers,
				interval: 2000,
				enabled: true
			}
		}
	}
});


export {initNode, connectNode};
