const {spawn} = require("child_process");
const fs = require("fs");

const log = console.log
const store = [];
console.log = function (...msg) {
	log(...msg);
	store.push(...msg);
}

let bootstrapper
let joiner

process.on('SIGINT', () => {
	if (bootstrapper) {
		bootstrapper.kill('SIGINT');
	}
	if (joiner) {
		joiner.kill('SIGINT');
	}
	process.exit(0);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const doTheThing = (i) => new Promise((resolve) => {
	const spawnArgs = ['bin/temp', ("00" + i).slice(-3)];
	const proc = spawn('node', spawnArgs);
	const timeout = setTimeout(() => {
		proc.kill('SIGINT');
	}, 10000)
	proc.stdout.on('data', (data) => {
		const log = data.toString();
		console.log(log);
	});
	proc.on('exit', () => {
		clearTimeout(timeout);
		resolve();
	});
	joiner = proc;
});

(async () => {
	const spawnArgs = ['bin/temp', "000"];
	bootstrapper = spawn('node', spawnArgs);
	bootstrapper.stdout.on('data', (data) => console.log(data.toString()));
	for (let i = 1; i <= 100; i = i + 1) {
		await sleep(200);
		await doTheThing(i);
	}
	await new Promise((resolve) =>
		fs.writeFile(`${__dirname}/join-cost.log`, store.join("\n"), resolve));
})();
