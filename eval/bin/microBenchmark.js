const {CRDTree} = require("crdtree");
const fs = require("fs");

const test = (setup, onIteration) => (count) => {
	const crdt = setup();
	const start = Date.now();
	for (let i = 0; i < count; ++i) {
		onIteration(crdt, i);
	}
	return Date.now() - start;
};

const newCrdt = (starter) => {
	const copy = JSON.parse(JSON.stringify(starter));
	return () => {
		const crdt = new CRDTree();
		crdt.assign([], copy);
		return crdt;
	};
};
const newArray = newCrdt([]);
const newObject = newCrdt({});
const newNull = newCrdt(null);

const arrayInOrder = test(newArray, (crdt, i) => crdt.insert([i], i));
const arrayReverse = test(newArray, (crdt, i) => crdt.insert([0], i));
const map = test(newObject, (crdt, i) => crdt.assign([String(i)], i));
const noop = test(newNull, (crdt) => crdt.noop());

const merge = (count) => {
	const crdtA = new CRDTree();
	const crdtB = new CRDTree();
	crdtA.assign([], []);
	crdtA.insert([0], "@");

	crdtB.merge(crdtA);

	for (let i = 0; i < count; ++i) {
		crdtA.insert([0], i);
		crdtB.insert([i + 1], i);
	}

	const start = Date.now();
	crdtA.merge(crdtB);
	return Date.now() - start;
};


const benchmark = async (name, proc) => {
	let csv = `OP_COUNT,MS`;
	for (let i = 0; i < 5000; ++i) {
		if (i % 100 === 0) {
			console.log("Done", i);
		}
		const time = proc(i);
		csv = `${csv}\n${i},${time}`;
		await Promise.resolve(); // Empty out the queue of callbacks
	}
	fs.writeFileSync(`${__dirname}/${name}.csv`, csv);
	console.log("Done", name);
};

(async () => {
	console.log("start benchmarking");
	// await benchmark("in order", arrayInOrder);
	// await benchmark("reverse", arrayReverse);
	// await benchmark("map", map);
	await benchmark("noop", noop);
	// await benchmark("merge", merge);
	process.exit(0);
})();
