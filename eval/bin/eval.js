const {spawn} = require("child_process");
const fs = require("fs");

const doTheThing = (j, i, kind, wait) =>
	new Promise((resolve) => {
		const spawnArgs = ['bin/spawn', i, kind, wait];
		console.log('node', ...spawnArgs);
		const proc = spawn('node', spawnArgs);
		let procLogs = "";
		const finish = () => {
			proc.kill('SIGINT');
			fs.writeFile(`${__dirname}/${i}-${j}-${kind}-${wait}.log`, procLogs, resolve);
		};
		const timeout = setTimeout(finish, 5000 * i);
		proc.stdout.on('data', (data) => {
			procLogs += data.toString();
			const match = procLogs.match(/<<</g);
			if (match && match.length === i) {
				clearTimeout(timeout);
				finish();
			}
		});

	});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
	for (let i = 1; i <= 100; i = i + 1) {
		for (let j = 0; j < 3; j = j + 1) {
			await doTheThing(j, i, 'basic', String(true));
			await sleep(100);
			await doTheThing(j, i, 'basic', "");
			await sleep(100);
			await doTheThing(j, i, 'recommended', String(true));
			await sleep(100);
			await doTheThing(j, i, 'recommended', "");
			await sleep(100);
			console.log("End iter", j, i);
		}
	}
	process.exit(0);
})();

