import execa from 'execa';
import fs from 'fs';
import { wunderctlBinaryPath } from '@wundergraph/wunderctl';
import { WgEnvironmentVariable } from '@wundergraph/protobuf';
import { WgEnvValue } from '../env/env';

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

	const logLevel = WgEnvValue(WgEnvironmentVariable.WG_CLI_LOG_LEVEL);
	if (logLevel) {
		args.push('--loglevel', logLevel);
	}

	const logJson = WgEnvValue(WgEnvironmentVariable.WG_CLI_LOG_JSON);
	if (logJson) {
		args.push(`--json-encoded-logging=${logJson}`);
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
