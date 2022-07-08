import * as fs from 'fs';
import rimraf from 'rimraf';
import { logger } from './logger';

export const uninstaller = (binaryDir: string) => {
	const log = logger.extend('install');
	const error = logger.extend('error:install');

	log('uninstalling wunderctl');
	const exists = fs.existsSync(binaryDir);
	if (!exists) {
		log('wunderctl not found at install dir, skipping uninstall');
		return;
	}
	rimraf(binaryDir, (e) => {
		if (e) {
			error('failed uninstalling wunderctl: ' + e.message);
			return;
		}
		log('wunderctl uninstalled');
	});
};
