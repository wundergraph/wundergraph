import axios from 'axios';
import { x } from 'tar';
import { downloadURL, wunderctlPath, wunderGraphDir } from './binarypath';
import * as fs from 'fs';
import rimraf from 'rimraf';
import { logger } from './logger';

const install = async () => {
	const log = logger.extend('install');
	const error = logger.extend('error:install');

	const installDir = wunderGraphDir();

	const version = JSON.parse(fs.readFileSync('package.json').toString()).engines.wundergraph;

	log(`installing wunderctl to: ${installDir}`);

	if (!fs.existsSync(installDir)) {
		fs.mkdirSync(installDir, { recursive: true });
	}

	const binaryPath = wunderctlPath();
	if (fs.existsSync(binaryPath)) {
		log(`removing existing binary at ${binaryPath}`);
		rimraf(binaryPath, (err) => {
			if (err) {
				error('error uninstalling previous version');
				return;
			}
			log('previous version uninstalled');
		});
	}

	try {
		const url = downloadURL(version);
		log(`download binary from ${url}`);

		const res = await axios({ url, responseType: 'stream' });
		const outStream = x({ C: installDir });
		res.data.pipe(outStream);
		outStream.addListener('finish', () => {
			log(`wunderctl v${version} installed/updated`);
			log(`make binary executable`);
			chmodX(binaryPath);
		});
		outStream.addListener('error', (err) => {
			error('Error installing wunderctl: ' + err.message);
		});
	} catch (e: any) {
		error('Error installing wunderctl: ' + e.message);
	}
};

function chmodX(filename: string) {
	const s = fs.statSync(filename);
	const newMode = s.mode | 64 | 8 | 1;
	if (s.mode === newMode) return;
	const base8 = newMode.toString(8).slice(-3);
	fs.chmodSync(filename, base8);
}

export default install();
