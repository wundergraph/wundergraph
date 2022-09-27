import { Dirent } from 'fs';
const { readdir } = require('fs').promises;
import path from 'path';

/**
 * Returns the list webhook files in the directory.
 */
export const getWebhooks = async (dir: string): Promise<{ filePath: string; name: string }[]> => {
	const list = await readdir(dir, { withFileTypes: true });
	return list
		.filter((file: Dirent) => {
			return file.isFile() && !file.name.endsWith('.d.ts') && file.name.endsWith('.ts');
		})
		.map((entry: Dirent) => {
			return {
				// ts is transpiled to js
				filePath: path.join(dir, entry.name.replace('.ts', '.js')),
				// we need to know the name of the file to compare it with the webhooks settings
				// in the config
				name: path.basename(entry.name, '.ts'),
			};
		});
};
