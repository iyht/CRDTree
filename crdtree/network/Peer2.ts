
import {createNode} from "./P2P";
import {RootNetwork} from "./RootNetwork";
import {CRDTree} from "../src/CRDTree";
import {ICRDTree} from "../src/API";

// let crdtA: ICRDTree;
// crdtA.assign(["foo"], 69);

let rn : RootNetwork;
rn = new RootNetwork();
rn.connect('/ip4/127.0.0.1/tcp/63785/ipfs/QmWGDfzPyfuYy9u71EJFvUe3wzgLJp9NwGvYrj2WnCA1sM');
// rn.send(crdtA);