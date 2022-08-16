import { Dirent } from 'fs';
const { readdir } = require('fs').promises;
import path from 'path';

/**
 * Returns the list webhook files in the directory. Since we use the filename as the webhook name
 * the second argument is required to omit the file extension.
 */
export const getWebhooks = async (dir: string, ext: '.ts' | '.js'): Promise<{ filePath: string; name: string }[]> => {
	const list = await readdir(dir, { withFileTypes: true });
	return list.map((entry: Dirent) => {
		return {
			filePath: path.join(dir, entry.name),
			name: path.basename(entry.name, ext),
		};
	});
};
