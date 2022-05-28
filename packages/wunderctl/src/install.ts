import {wunderctlDir} from './binarypath';
import fs from "fs";
import {logger} from './logger';
import {installer, wunderctlName} from "@wundergraph/tools";

const install = async () => {
	const log = logger.extend('install');
	const installDir = wunderctlDir();

	log(`installing wunderctl to: ${installDir}`);

	const version = JSON.parse(fs.readFileSync('package.json').toString()).version;
	await installer(version, installDir, wunderctlName())
};

export default install();
