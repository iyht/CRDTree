import {RootNetwork} from "../../src/RootNetwork";
import {ICRDTree, CRDTree} from "crdtree";

let crdtA: ICRDTree;
crdtA = new CRDTree([], "A");

let crdtB: ICRDTree;
crdtB = new CRDTree([], "B");

crdtA.assign([], {});
crdtA.assign(["foo"], 69);

let rn: RootNetwork;
rn = new RootNetwork(crdtA);
rn.connect('/ip4/127.0.0.1/tcp/63785/ipfs/QmWGDfzPyfuYy9u71EJFvUe3wzgLJp9NwGvYrj2WnCA1sM');


let rn1: RootNetwork;
rn1 = new RootNetwork(crdtB);
rn1.connect('/ip4/127.0.0.1/tcp/63785/ipfs/QmWGDfzPyfuYy9u71EJFvUe3wzgLJp9NwGvYrj2WnCA1sM');

setTimeout(function () {
	console.log("send CRDT");
	rn.send(crdtA);
}, 6000);

setTimeout(function () {
	// rn.disconnect();
	// rn1.disconnect();
	console.log(rn.crdt.render());
	console.log(rn1.crdt.render());
}, 10000);



