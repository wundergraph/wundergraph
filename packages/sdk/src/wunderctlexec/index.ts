import path from 'path';
import execa from 'execa';
import fs from 'fs';

export interface WunderCtlExecArgs {
	cmd: string[];
	timeout?: number;
}

export const getWunderCtlExecPath = (): string => {
	return path.join(__dirname, '..', '..', 'bin', 'wunderctl');
};

export const wunderctlExec = (args: WunderCtlExecArgs): execa.ExecaSyncReturnValue<string> | undefined => {
	if (args.timeout === undefined) {
		args.timeout = 1000 * 30;
	}
	const binaryPath = getWunderCtlExecPath();
	if (!fs.existsSync(binaryPath)) {
		throw new Error('wunderctl binary not found');
	}

	return execa.sync(binaryPath, args.cmd, {
		encoding: 'utf-8',
		timeout: args.timeout,
		cwd: process.cwd(),
		extendEnv: true,
		stdio: 'pipe',
	});
};

export const wunderctlExecAsync = async (args: WunderCtlExecArgs): Promise<string> => {
	const binaryPath = getWunderCtlExecPath();
	if (!fs.existsSync(binaryPath)) {
		throw new Error('wunderctl binary not found');
	}
	const subprocess = execa(binaryPath, args.cmd, {
		timeout: args.timeout,
		cwd: process.cwd(),
		extendEnv: true,
	});
	subprocess.stdout?.pipe(process.stdout);
	subprocess.stderr?.pipe(process.stderr);

	const { stdout } = await subprocess;
	return stdout;
};
