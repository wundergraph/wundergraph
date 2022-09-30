import execa from 'execa';
import fs from 'fs';
import { wunderctlBinaryPath } from '@wundergraph/wunderctl';

export interface WunderCtlExecArgs {
	cmd: string[];
	timeout?: number;
}

export const wunderctlExec = (args: WunderCtlExecArgs): execa.ExecaSyncReturnValue<string> | undefined => {
	const file = wunderctlBinaryPath();
	if (!fs.existsSync(file)) {
		throw new Error('wunderctl binary not found');
	}
	if (process.env.WG_DIR_ABS) {
		args.cmd.push('--wundergraph-dir', '.');
	}
	return execa.sync(file, args.cmd, {
		encoding: 'utf-8',
		timeout: args.timeout,
		cwd: process.env.WG_DIR_ABS || process.cwd(),
		extendEnv: true,
		stdio: 'pipe',
	});
};

export const wunderctlExecAsync = async (args: WunderCtlExecArgs): Promise<string> => {
	const file = wunderctlBinaryPath();
	if (!fs.existsSync(file)) {
		throw new Error('wunderctl binary not found');
	}
	if (process.env.WG_DIR_ABS) {
		args.cmd.push('--wundergraph-dir', '.');
	}
	const subprocess = execa(file, args.cmd, {
		timeout: args.timeout,
		cwd: process.env.WG_DIR_ABS || process.cwd(),
		extendEnv: true,
	});
	subprocess.stdout?.pipe(process.stdout);
	subprocess.stderr?.pipe(process.stderr);

	const { stdout } = await subprocess;
	return stdout;
};
