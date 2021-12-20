const {connectTo, initNetwork} = require("network/dist/src/Network");
const {spawn} = require("child_process");

const [sid, kind, numBeforeDone] = process.argv.slice(2);

const spawned = [];

process.on('SIGINT', () => {
	spawned.forEach((proc) => proc.kill('SIGINT'));
	process.exit(0);
});

let sent = false;
let done = false;

const checkAndPrint = (crdt, id, numBeforeStart, numBeforeDone) => {
	const count = crdt.crdt.state.branches.get("ROOT").seen.size;
	// if (count >= Number(numBeforeStart) && sent === false) {
	// 	console.log(">>>", id, Date.now());
	// 	crdt.assign([], null);
	// 	sent = true;
	// }
	if (count >= Number(numBeforeDone) && done === false) {
		console.log("<<<", id, Date.now());
		done = true;
	}
};

const pickCRDT = (kind, id) => {
	if (kind === "connector") {
		return connectTo(["TODO?"], id);
	} else if (kind === "basic") {
		return initNetwork([], id, "Basic");
	} else {
		return initNetwork([], id, "Recommended");
	}
};

const run = () => new Promise((resolve) => {
	const id = Number(sid);
	if (id === 0) {
		return resolve();
	}
	const spawnArgs = ['bin/recur', ("00" + (id - 1)).slice(-3), "connector", numBeforeDone];
	const proc = spawn("node", spawnArgs);
	proc.stdout.on('data', (data) => {
		const log = data.toString().trim();
		console.log(log);
		if (log.includes(">>>")) {
			resolve();
		}
	});
	spawned.push(proc);
});

(async () => {
	const crdt = await pickCRDT(kind, sid);
	crdt.onUpdate(() => checkAndPrint(crdt, sid, 0, numBeforeDone));
	checkAndPrint(crdt, sid, 0, numBeforeDone);
	console.log("!!!", sid, Date.now());
	await run();
	console.log(">>>", sid, Date.now());
	crdt.assign([], sid);
})();
