import execa from 'execa';
import fs from 'fs';
import { wunderctlBinaryPath } from './binarypath';

const run = async () => {
	const file = wunderctlBinaryPath();
	if (!fs.existsSync(file)) {
		console.error(`Could not find binary in ${file}.\nEnsure that you did not ignore post-install hooks.`);
		process.exit(1);
	}

	const [, , ...args] = process.argv;

	const subprocess = execa(file, args);
	subprocess.stdout?.pipe(process.stdout);
	subprocess.stderr?.pipe(process.stderr);

	try {
		await subprocess;
	} catch (error: any) {
		process.exit(1);
	}
};

export default run;
