const Libp2p = require('libp2p')
// dependency for transport 
const TCP = require('libp2p-tcp') // allow us talk to other server nodes
const Websockets = require('libp2p-websockets') // allow us to talk to bootstrap nodes(contains SSL)
const WebRTCStar = require('libp2p-webrtc-star') // talk over browsers
const wrtc = require('wrtc') // WebRTC in js
const { NOISE } = require('libp2p-noise') // connection encryption

const Mplex = require('libp2p-mplex') // stream multiplexing for reusing connection
const MulticastDNS = require('libp2p-mdns')


const createNode = async () => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0'] // assign any port available locally
    },
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      // peerDiscovery: [MulticastDNS]
    },
    config: {
    }
  })

  return node
}


// ;(async () => {

//   const [node1, node2] = await Promise.all([
//         createNode(), 
//         createNode()
//   ])
//   console.log(node1.peerId.toB58String())
//   console.log(node2.peerId.toB58String())
// })();

export {createNode};

// console.log(node.peerId.toB58String())
// ;(async () => {
//   const [node1, node2] = await Promise.all([
//     createNode(),
//     createNode()
//   ])

//   node1.on('peer:discovery', (peerId) => console.log('Discovered:', peerId.toB58String()))
//   node2.on('peer:discovery', (peerId) => console.log('Discovered:', peerId.toB58String()))

//   await Promise.all([
//     node1.start(),
//     node2.start()
//   ])
// })();