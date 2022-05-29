import { logger } from './../logger';
import { uninstaller } from './../uninstaller';
import { wunderctlBinaryPath } from './../binarypath';

export const uninstall = () => {
	const log = logger.extend('uninstall');
	const binaryPath = wunderctlBinaryPath();
	log(`uninstalling wunderctl ${binaryPath}`);
	uninstaller(binaryPath);
};

export default uninstall();
