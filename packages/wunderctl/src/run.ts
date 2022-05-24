import { wunderctlPath } from './binarypath';
import * as fs from 'fs';
import execa from 'execa';

const run = async () => {
	const executablePath = wunderctlPath();
	if (!fs.existsSync(executablePath)) {
		console.error(`You must install wunderctl before you can run it:\nnpm i -g @wundergraph/wunderctl`);
		process.exit(1);
	}

	const [, , ...args] = process.argv;

	const subprocess = execa(executablePath, args);
	subprocess.stdout?.pipe(process.stdout);
	subprocess.stderr?.pipe(process.stderr);

	try {
		await subprocess;
	} catch (error: any) {
		process.exit(1);
	}
};

export default run;
