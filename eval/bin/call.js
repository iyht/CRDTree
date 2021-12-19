// [KIND, ID, Number to wait for before incrementing, number to wait for before timer done]
// KIND ::= CONNECTOR, BASIC, RECOMMENDED
const {connectTo, initNetwork} = require("network/dist/src/Network");

const args = process.argv.slice(2);

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
		crdt.assign([], []);
	}
};

const checkAndPrint = (render, id, numBeforeStart, numBeforeDone, crdt) => {
	if (Array.isArray(render) && render.length >= Number(numBeforeStart) && sent === false) {
		console.log(">>>", id, Date.now());
		crdt.insert([0], null);
		sent = true;
	}
	if (Array.isArray(render) && render.length >= Number(numBeforeDone) && done === false) {
		console.log("<<<", id, Date.now());
		done = true;
	}
};

(async () => {
	const [kind, id, numBeforeStart, numBeforeDone] = args;
	console.log("...", id, Date.now());
	const crdt = await pickCRDT(kind, id);
	console.log("!!!", id, Date.now());
	crdt.onUpdate((render) => checkAndPrint(render, id, numBeforeStart, numBeforeDone, crdt));
	const render = crdt.render;
	checkAndPrint(render, id, numBeforeStart, numBeforeDone, crdt);
	bootstrapCRDT(crdt, kind);
})();
