import fs from 'fs';
import { logger } from './../logger';
import { wunderctlName, binaryDir } from './../binarypath';
import { installer } from './../installer';

const install = async () => {
	const log = logger.extend('install');

	log(`installing wunderctl to: ${binaryDir}`);

	const version = JSON.parse(fs.readFileSync('package.json').toString()).version;
	await installer(version, binaryDir, wunderctlName());
};

export default install();
