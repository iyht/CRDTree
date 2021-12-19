const {spawn} = require("child_process");
const fs = require("fs");

const doTheThing = (j, i, kind, wait) =>
	new Promise((resolve) => {
		const spawnArgs = ['bin/spawn', i, kind, wait];
		console.log('node', ...spawnArgs);
		const proc = spawn('node', spawnArgs);
		let procLogs = "";
		proc.stdout.on('data', (data) => {
			procLogs += data.toString();
			if (procLogs.length >= 23 * 4 * i) {
				proc.kill('SIGINT');
				fs.writeFile(`${__dirname}/${j}-${kind}-${wait}-${i}.log`, procLogs, resolve);
			}
		});
	});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
	for (let i = 1; i <= 100; i = i + 1) {
		for (let j = 0; j < 3; j = j + 1) {
			await doTheThing(j, i, 'basic', String(true));
			await sleep(50);
			await doTheThing(j, i, 'basic', "");
			await sleep(50);
			await doTheThing(j, i, 'recommended', String(true));
			await sleep(50);
			await doTheThing(j, i, 'recommended', "");
			await sleep(50);
			console.log("End iter", j, i);
		}
	}
	process.exit(0);
})();

