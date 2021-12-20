// [KIND, ID, Number to wait for before incrementing, number to wait for before timer done]
// KIND ::= CONNECTOR, BASIC, RECOMMENDED
const {connectTo, initNetwork} = require("network/dist/src/Network");

const args = process.argv.slice(2);

process.on('SIGINT', () => {
	console.log("exiting...");
	process.exit(0);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let sent = false;
let done = false;

const pickCRDT = (kind, id) => {
	if (kind === "connector") {
		return connectTo(["TODO?"], id);
	} else if (kind === "basic") {
		return initNetwork([], id, "Basic");
	} else {
		return initNetwork([], id, "Recommended");
	}
};

const bootstrapCRDT = (crdt, kind) => {
	if (kind !== "connector") {
		// crdt.assign([], []);
	}
};

const checkAndPrint = (crdt, id, numBeforeStart, numBeforeDone) => {
	const count = crdt.crdt.state.branches.get("ROOT").seen.size;
	if (count >= Number(numBeforeStart) && sent === false) {
		console.log(">>>", id, Date.now());
		crdt.assign([], null);
		sent = true;
	}
	if (count >= Number(numBeforeDone) && done === false) {
		console.log("<<<", id, Date.now());
		done = true;
	}
};

(async () => {
	const [kind, id, numBeforeStart, numBeforeDone, delay] = args;
	await sleep(Number(delay) * Number(id));
	console.log("...", id, Date.now());
	const beforePick = Date.now();
	const crdt = await pickCRDT(kind, id);
	const pickTime = Date.now() - beforePick;
	await sleep(((Number(numBeforeDone) - Number(id)) * Number(delay)) - pickTime);
	console.log("!!!", id, Date.now());
	crdt.onUpdate((render) => checkAndPrint(crdt, id, numBeforeStart, numBeforeDone));
	checkAndPrint(crdt, id, numBeforeStart, numBeforeDone);
	bootstrapCRDT(crdt, kind);
})();
