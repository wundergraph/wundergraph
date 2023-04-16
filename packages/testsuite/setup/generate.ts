import execa from 'execa';
import { join } from 'node:path';
import { wunderctlBinaryPath } from '@wundergraph/wunderctl';

export async function Setup(path: string) {
	await Clean(path);
	await Generate(path);
	await TscCheck(path);
}

export async function Clean(path: string) {
	const cmdArgs = ['clean'];

	await execa(wunderctlBinaryPath(), cmdArgs, {
		encoding: 'utf-8',
		extendEnv: true,
		cwd: join(process.cwd(), path),
		stdio: 'inherit',
	});
}

export async function Generate(path: string) {
	const cmdArgs = ['generate'];

	await execa(wunderctlBinaryPath(), cmdArgs, {
		encoding: 'utf-8',
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
