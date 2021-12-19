const {spawn} = require("child_process");
const fs = require("fs");

const doTheThing = (i, kind, wait) =>
	new Promise((resolve) => {
		const spawnArgs = ['bin/spawn', i, kind, wait];
		console.log('node', ...spawnArgs);
		const proc = spawn('node', spawnArgs);
		let procLogs = "";
		proc.stdout.on('data', (data) => {
			procLogs += data.toString();
			if (procLogs.length === 23 * 4 * i) {
				proc.kill('SIGINT');
				fs.writeFile(`${__dirname}/${kind}-${wait}-${i}.log`, procLogs, resolve);
			}
		});
	});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
	for (let i = 1; i <= 100; i = i + 1) {
		await doTheThing(i, 'basic', String(true));
		await sleep(50 * i);
		await doTheThing(i, 'basic', "");
		await sleep(50 * i);
		console.log("Half way iter", i);
		await doTheThing(i, 'recommended', String(true));
		await sleep(50 * i);
		await doTheThing(i, 'recommended', "");
		await sleep(50 * i);
		console.log("End iter", i);
	}
	process.exit(0);
})();

