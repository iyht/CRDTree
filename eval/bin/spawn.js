const {spawn} = require("child_process");

// [Number of nodes, kind, wait]
const [numberOfNodes, inputKind, wait] = process.argv.slice(2);
const shouldWait = !!wait;

const spawned = [];

process.on('SIGINT', () => {
	spawned.forEach((proc) => proc.kill('SIGINT'));
	process.exit(0);
});

(async () => {
	for (let i = 0; i < Number(numberOfNodes); i = i + 1) {
		const kind = i === 0 ? inputKind : 'connector';
		const spawnArgs = ['bin/call', kind, ("00" + i).slice(-3), String(shouldWait ? i : 0), numberOfNodes];
		const proc = spawn('node', spawnArgs);
		proc.stdout.on('data', (data) => console.log(data.toString()));
		spawned.push(proc);
	}
})();
