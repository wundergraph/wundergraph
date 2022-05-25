import os from 'os';
import path from 'path';
import spawn from 'cross-spawn';
import { SpawnSyncReturns } from 'child_process';

export interface WunderCtlExecArgs {
	cmd: string[];
	timeout?: number;
}

export const wunderctlExec = (args: WunderCtlExecArgs): SpawnSyncReturns<string> | undefined => {
	if (args.timeout === undefined) {
		args.timeout = 1000 * 30;
	}

	let result: SpawnSyncReturns<string> | undefined;

	for (let i = 0; i < 4; i++) {
		try {
			switch (i) {
				case 0:
					result = exec1(args);
					if (!result.error) {
						return result;
					}
					continue;
				case 1:
					result = exec2(args);
					if (!result.error) {
						return result;
					}
					continue;
				case 2:
					result = exec3(args);
					if (!result.error) {
						return result;
					}
					continue;
				case 3:
					result = exec4(args);
					if (!result.error) {
						return result;
					}
					continue;
			}
		} catch (e) {
			console.log(e);
		}
	}

	console.log('wunderctlExec: failed to execute wunderctl, make sure it is installed and in your PATH');

	return result;
};

export const wunderctlExecAsync = async (args: WunderCtlExecArgs): Promise<string> => {
	return new Promise((resolve, reject) => {
		const child = spawn.spawn('wunderctl', args.cmd, {
			cwd: process.cwd(),
			timeout: args.timeout,
			stdio: 'pipe',
			env: {
				...process.env,
			},
		});
		const buf: string[] = [];
		child.stdout?.setEncoding('utf-8');
		child.stdout?.on('data', (data) => {
			console.log(data);
			buf.push(data);
		});
		child.on('exit', (code) => {
			if (code === 0) {
				resolve(buf.join());
			} else {
				reject(buf.join());
			}
		});
	});
};

const exec1 = (args: WunderCtlExecArgs) => {
	return spawn.sync('wunderctl', args.cmd, {
		cwd: process.cwd(),
		encoding: 'utf-8',
		timeout: args.timeout,
		stdio: 'pipe',
		env: {
			...process.env,
		},
	});
};

const exec2 = (args: WunderCtlExecArgs) => {
	return spawn.sync(path.join(os.homedir(), '.wundergraph', 'wunderctl'), args.cmd, {
		cwd: process.cwd(),
		encoding: 'utf-8',
		timeout: args.timeout,
		stdio: 'pipe',
		env: {
			...process.env,
		},
	});
};

const exec3 = (args: WunderCtlExecArgs) => {
	return spawn.sync('yarn', ['wunderctl', ...args.cmd], {
		cwd: process.cwd(),
		encoding: 'utf-8',
		timeout: args.timeout,
		stdio: 'pipe',
		env: {
			...process.env,
		},
	});
};

const exec4 = (args: WunderCtlExecArgs) => {
	return spawn.sync('npm', ['run', 'wunderctl', ...args.cmd], {
		cwd: process.cwd(),
		encoding: 'utf-8',
		timeout: args.timeout,
		stdio: 'pipe',
		env: {
			...process.env,
		},
	});
};
