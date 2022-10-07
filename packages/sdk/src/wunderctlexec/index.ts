import execa from 'execa';
import fs from 'fs';
import { wunderctlBinaryPath } from '@wundergraph/wunderctl';

export interface WunderCtlExecArgs {
	cmd: string[];
	timeout?: number;
}

export const wunderctlExec = (args: WunderCtlExecArgs): execa.ExecaSyncReturnValue<string> | undefined => {
	const file = wunderCtlFile();
	const cmdArgs = wunderCtlArgs(args.cmd);

	return execa.sync(file, cmdArgs, {
		encoding: 'utf-8',
		timeout: args.timeout,
		cwd: process.env.WG_DIR_ABS || process.cwd(),
		extendEnv: true,
		stdio: 'pipe',
	});
};

export const wunderctlExecAsync = async (args: WunderCtlExecArgs): Promise<string> => {
	const file = wunderCtlFile();
	const cmdArgs = wunderCtlArgs(args.cmd);

	const subprocess = execa(file, cmdArgs, {
		timeout: args.timeout,
		cwd: process.env.WG_DIR_ABS || process.cwd(),
		extendEnv: true,
	});
	subprocess.stdout?.pipe(process.stdout);
	subprocess.stderr?.pipe(process.stderr);

	const { stdout } = await subprocess;
	return stdout;
};

const wunderCtlArgs = (args: string[]): string[] => {
	if (process.env.WG_DIR_ABS) {
		args.push('--wundergraph-dir', '.');
	}

	if (process.env.WG_CLI_LOG_LEVEL) {
		args.push('--loglevel', process.env.WG_CLI_LOG_LEVEL);
	}

	if (process.env.WG_CLI_LOG_PRETTY) {
		args.push(`--pretty-logging=${process.env.WG_CLI_LOG_PRETTY}`);
	}

	return args;
};

const wunderCtlFile = (): string => {
	const file = wunderctlBinaryPath();
	if (!fs.existsSync(file)) {
		throw new Error('wunderctl binary not found');
	}

	return file;
};
