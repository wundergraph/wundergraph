import execa from 'execa';
import fs from 'fs';
import { wunderctlBinaryPath } from './binarypath';

export const cli = async () => {
	const file = wunderctlBinaryPath();
	if (!fs.existsSync(file)) {
		console.error(`Could not find binary in ${file}.\nEnsure that you did not ignore post-install hooks.`);
		process.exit(1);
	}

	const [, , ...args] = process.argv;

	// Inherit stdio from parent process. This important for the CLI to work.
	const subprocess = execa(file, args, { stdio: 'inherit', windowsHide: false });

	process.once('SIGINT', () => {
		subprocess.cancel();
	});

	try {
		await subprocess;
	} catch (error: any) {
		process.exit(1);
	}
};
