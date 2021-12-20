const {connectTo, initNetwork} = require("network/dist/src/Network");

const args = process.argv.slice(2);
const [id] = args;
let crdt;
(async () => {
	const start = Date.now();
	console.log("...", id);

	if (Number(id) === 0) {
		crdt = await initNetwork([], id, "Recommended");
	} else {
		crdt = await connectTo(["?"], id);
	}
	console.log(">>>", id, Date.now() - start);
	crdt.assign([], id);
	await new Promise((resolve) => setTimeout(resolve, 500));
	if (Number(id) !== 0) {
		process.exit(0);
	}
})();
