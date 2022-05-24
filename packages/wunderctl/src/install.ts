import axios from 'axios';
import { x } from 'tar';
import { downloadURL, wunderctlPath, wunderGraphDir } from './binarypath';
import * as fs from 'fs';
import rimraf from 'rimraf';

const install = async () => {
	const installDir = wunderGraphDir();

	console.log(`installing wunderctl to: ${installDir}`);
	const version = JSON.parse(fs.readFileSync('package.json').toString()).version;

	if (!fs.existsSync(installDir)) {
		fs.mkdirSync(installDir, { recursive: true });
	}

	const binaryPath = wunderctlPath();
	if (fs.existsSync(binaryPath)) {
		rimraf(binaryPath, (err) => {
			if (err) {
				console.log('error uninstalling previous version');
				return;
			}
			console.log('previous version uninstalled');
		});
	}

	try {
		const res = await axios({ url: downloadURL(version), responseType: 'stream' });
		const outStream = x({ C: installDir });
		res.data.pipe(outStream);
		outStream.addListener('finish', () => {
			console.log(`wunderctl v${version} installed/updated`);
		});
		outStream.addListener('error', (err) => {
			console.log('Error installing wunderctl: ' + err.message);
		});
	} catch (e: any) {
		console.log('Error installing wunderctl: ' + e.message);
	}
};

export default install();
