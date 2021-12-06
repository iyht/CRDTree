import {RootNetwork} from "../../src/RootNetwork";
import {CRDTree} from "crdtree";

let rn: RootNetwork;
rn = new RootNetwork(new CRDTree([], "A"));
rn.connect('/ip4/127.0.0.1/tcp/63785/ipfs/QmWGDfzPyfuYy9u71EJFvUe3wzgLJp9NwGvYrj2WnCA1sM');


let rn1: RootNetwork;
rn1 = new RootNetwork(new CRDTree([], "B"));
rn1.connect('/ip4/127.0.0.1/tcp/63785/ipfs/QmWGDfzPyfuYy9u71EJFvUe3wzgLJp9NwGvYrj2WnCA1sM');

rn.assign([], {});
rn.assign(["foo"], 69);

setTimeout(function () {
	// rn.disconnect();
	// rn1.disconnect();
	console.log(rn.render());
	console.log(rn1.render());
}, 10000);



