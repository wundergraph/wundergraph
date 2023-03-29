import path from 'node:path';
import fs from 'fs/promises';

const fileExists = async (filename: string) => {
	try {
		const stats = await fs.stat(filename);
		return !stats.isDirectory();
	} catch {}
	return false;
};

// return the first file named filename starting from cwd and walking
// up the filesystem hierarchy until the root
export const findUp = async (filename: string, cwd: string) => {
	let cur = path.resolve(cwd);
	const { root } = path.parse(cur);
	while (true) {
		const potentialMatch = path.join(cur, filename);
		if (await fileExists(potentialMatch)) {
			return potentialMatch;
		}
		if (cur === root) {
			break;
		}
		cur = path.dirname(cur);
	}
};
