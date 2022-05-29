import fs from 'fs';
import { logger } from './../logger';
import { wunderctlName, wunderctlDir } from './../binarypath';
import { installer } from './../installer';

const install = async () => {
	const log = logger.extend('install');

	log(`installing wunderctl to: ${wunderctlDir}`);

	const version = JSON.parse(fs.readFileSync('package.json').toString()).version;
	await installer(version, wunderctlDir, wunderctlName());
};

export default install();
