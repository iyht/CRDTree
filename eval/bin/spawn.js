const {spawn} = require("child_process");

// [Number of nodes]
const [numberOfNodes] = process.argv.slice(2);

const spawned = [];

(async () => {
	for (let i = 0; i < Number(numberOfNodes); i = i + 1) {
		const kind = i === 0 ? 'basic' : 'connector';
		const spawnArgs = ['bin/call', kind, String(i), String(0), numberOfNodes];
		const proc = spawn('node', spawnArgs);
		proc.stdout.on('data', (data) => console.log(data.toString()));
		spawned.push(proc);
	}
})();
