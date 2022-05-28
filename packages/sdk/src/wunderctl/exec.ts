import * as fs from 'fs';
import execa from 'execa';
import {wunderctlBinaryPath} from "./helper";

const exec = async () => {
	const executablePath = wunderctlBinaryPath();
	if (!fs.existsSync(executablePath)) {
		console.error(`Could not find binary in ${executablePath}.\nEnsure that you did not ignore post-install hooks.`);
		process.exit(1);
	}

	const [, , ...args] = process.argv;

	const subprocess = execa(executablePath, args);
	subprocess.stdout?.pipe(process.stdout);
	subprocess.stderr?.pipe(process.stderr);

	try {
		await subprocess;
	} catch (error: any) {
		error(error);
		process.exit(1);
	}
};

export default exec;
