import execa from 'execa';
import { join } from 'node:path';
import { wunderctlBinaryPath } from '@wundergraph/wunderctl';

export interface BuildOptions {
	env?: Record<string, string>;
}

export async function Setup(path: string, options?: BuildOptions) {
	await Clean(path, options);
	await Generate(path, options);
	await TscCheck(path);
}

export async function Clean(path: string, options?: BuildOptions) {
	const cmdArgs = ['clean'];

	await execa(wunderctlBinaryPath(), cmdArgs, {
		encoding: 'utf-8',
		env: options?.env,
		extendEnv: true,
		cwd: join(process.cwd(), path),
		stdio: 'inherit',
	});
}

export async function Generate(path: string, options?: BuildOptions) {
	const cmdArgs = ['generate'];

	await execa(wunderctlBinaryPath(), cmdArgs, {
		encoding: 'utf-8',
		env: options?.env,
		extendEnv: true,
		cwd: join(process.cwd(), path),
		stdio: 'inherit',
	});
}

export async function TscCheck(path: string) {
	const cmdArgs = ['exec', 'tsc', '--noEmit', '--project', path];

	await execa('pnpm', cmdArgs, {
		encoding: 'utf-8',
		extendEnv: true,
		stdio: 'inherit',
	});
}
