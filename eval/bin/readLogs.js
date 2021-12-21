const fs = require("fs");

const bootstrapOverhead = (...lines) => {
	let csv = "NUM_TO_JOIN,TIME,TIME2,TIME3";
	lines = lines.map(toTuple);
	lines = lines.map(l => l.filter(isInit));
	const took = (lines, i) => lines[i].time - lines[i - 1].time;
	for (let i = 1; i < lines[0].length; i = i + 1) {
		const row = lines.map((l) => took(l, i)).join(',');
		csv = `${csv}\n${i},${row}`;
	}
	return csv;
};

const subscriberOverhead = (...lines) => {
	lines = lines.map(toTuple);
	return lines.map(calcOverheadForOneExecution).join(',');
};

const calcOverheadForOneExecution = (rows) => {
	const sends = rows.filter(isSend);
	const dones = rows.filter(isDone);
	// sorted oldest to newest
	sends.sort((a, b) => a.time - b.time);
	dones.sort((a, b) => a.time - b.time);
	const firstSend = sends[0];
	const lastDone = dones[dones.length - 1];
	return lastDone.time - firstSend.time;
};

const isInit = ({kind}) => kind === "!!!";
const isSend = ({kind}) => kind === ">>>";
const isDone = ({kind}) => kind === "<<<";

const isValid = (log, size) => {
	log = log.trim()
	if (log.length !== (22 * 3 * size) - 1) {
		return false;
	} else {
		const rows = log.split("\n");
		return (rows.length === 3 * size) &&
			rows.every(row => row.length === 21);
	}
};

const toTuple = (log) =>
	log.split("\n")
		.map((line) => line.split(' '))
		.map(([kind, id, time]) =>
			({kind, id: Number(id), time: Number(time)}));

(async () => {
	const fname = (kind, i, j) => `${__dirname}/../../out/${i}-${j}-${kind}.log`;
	const file = (kind, i, j) => fs.readFileSync(fname(kind, i, j)).toString();

	let subsCalc = "";
	for (let i = 1; i <= 54; i++) {
		subsCalc += `\n${i},` + subscriberOverhead(
			file("basic", i, 0),
			file("basic", i, 1),
			file("basic", i, 2),
			file("recommended", i, 0),
			file("recommended", i, 1),
			file("recommended", i, 2),
		);
	}
	fs.writeFileSync(`${__dirname}/subs-times.csv`, subsCalc);

	const joins = bootstrapOverhead(
		file("basic", 54, 0),
		file("basic", 54, 1),
		file("basic", 54, 2),
		file("recommended", 54, 0),
		file("recommended", 54, 1),
		file("recommended", 54, 2),
	)
	fs.writeFileSync(`${__dirname}/join-times.csv`, joins);
})();


