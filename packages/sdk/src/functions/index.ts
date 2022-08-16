import { Dirent } from 'fs';
const { readdir } = require('fs').promises;
import { build } from 'tsup';
import path from 'path';

export const getFunctionPaths = async (functionsDir: string): Promise<string[]> => {
	const list = await readdir(functionsDir, { withFileTypes: true });
	return list.map((entry: Dirent) => {
		return path.join(functionsDir, entry.name);
	});
};

export const buildFunctions = async (functionsPaths: string[], outDir: string) => {
	await build({
		entry: functionsPaths,
		outDir,
		skipNodeModulesBundle: true,
		silent: false,
		platform: 'node',
		clean: true,
		bundle: true,
		target: 'node14',
	});
};
