import {RootNetwork} from "../../src/RootNetwork";
import {CRDTree} from "crdtree";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
	const rnA = new RootNetwork(new CRDTree([], "A"));
	await rnA.connect('/ip4/127.0.0.1/tcp/63785/ipfs/QmWGDfzPyfuYy9u71EJFvUe3wzgLJp9NwGvYrj2WnCA1sM');

	const rnB = new RootNetwork(new CRDTree([], "B"));
	await rnB.connect('/ip4/127.0.0.1/tcp/63785/ipfs/QmWGDfzPyfuYy9u71EJFvUe3wzgLJp9NwGvYrj2WnCA1sM');

	await sleep(5000);

	rnA.assign([], {});
	rnA.assign(["foo"], 69);

	await sleep(5000);

	console.log(rnA.render());
	console.log(rnB.render());
	process.exit(0);
})();



