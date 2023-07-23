import execa from 'execa';
import fs from 'fs';
import { wunderctlBinaryPath } from '@wundergraph/wunderctl';

export interface WunderCtlExecArgs {
	cmd: string[];
	env?: Record<string, string>;
	timeout?: number;
	stdio?: 'pipe' | 'ignore' | 'inherit' | readonly execa.StdioOption[];
}

export type Subprocess = execa.ExecaChildProcess;

export const wunderctl = (args: WunderCtlExecArgs): Subprocess => {
	const file = wunderCtlFile();
	const cmdArgs = wunderCtlArgs(args.cmd);

	return execa(file, cmdArgs, {
		encoding: 'utf-8',
		timeout: args.timeout,
		cwd: process.env.WG_DIR_ABS || process.cwd(),
		env: args.env ?? {},
		extendEnv: true,
		stdio: args.stdio,
	});
};

const wunderCtlArgs = (args: string[]): string[] => {
	if (process.env.WG_DIR_ABS) {
		args.push('--wundergraph-dir', process.env.WG_DIR_ABS);
	}

	if (process.env.WG_CLI_LOG_LEVEL) {
		args.push('--cli-log-level', process.env.WG_CLI_LOG_LEVEL);
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
