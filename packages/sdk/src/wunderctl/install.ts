import fs from 'fs';
import path from 'path';

export const version = JSON.parse(
	fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), { encoding: 'utf8' })
).engines.wundergraph;

export const wunderctlDir = (): string => {
	return path.join(__dirname, '..', '..', 'bin');
};
