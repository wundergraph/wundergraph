import axios from 'axios';
import { x } from 'tar';
import { downloadURL } from './binarypath';
import * as fs from 'fs';
import rimraf from 'rimraf';
import { logger } from './logger';
import path from 'path';
import type debug from 'debug';

export const installer = async (version: string, installDir: string, binaryName: string) => {
	const log = logger.extend('install');
	const error = logger.extend('error:install');

	const lockFile = path.join(installDir, 'download-lock');
	const binaryPath = path.join(installDir, binaryName);
	const locker = LockFile(version, lockFile);

	if (locker.exists()) {
		log(`Lock file already exists, skipping the download of the binary v${version}`);
		// That's a convenience, so we have a fixed path to current installed binary
		if (process.env.WG_COPY_BIN_PATH) {
			log(`copy v${version} binary to ${process.env.WG_COPY_BIN_PATH}`);
			copyFileRecursive(log, binaryPath, process.env.WG_COPY_BIN_PATH);
			log(`binary copied`);
		}
		return;
	}

	if (!fs.existsSync(installDir)) {
		fs.mkdirSync(installDir, { recursive: true });
	}

	locker.create();

	if (fs.existsSync(binaryPath)) {
		log(`removing existing binary at ${binaryPath}`);
		rimraf(binaryPath, (err) => {
			if (err) {
				locker.remove();
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

			// That's a convenience, so we have a fixed path to current installed binary
			if (process.env.WG_COPY_BIN_PATH) {
				log(`copy v${version} binary to ${process.env.WG_COPY_BIN_PATH}`);
				copyFileRecursive(log, binaryPath, process.env.WG_COPY_BIN_PATH);
				log(`binary copied`);
			}
		});
		outStream.addListener('error', (err) => {
			error('Error installing wunderctl: ' + err.message);
			locker.remove();
		});
	} catch (e: any) {
		locker.remove();
		error('Error installing wunderctl: ' + e.message);
	}
};

function copyFileRecursive(log: debug.Debugger, sourceFilePath: string, targetFilePath: string) {
	fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
	fs.copyFileSync(sourceFilePath, targetFilePath);
}

function LockFile(version: string, lockFile: string) {
	let createdLockFile = false;
	return {
		create: () => {
			if (createdLockFile) {
				return;
			}
			fs.writeFileSync(lockFile, version);
			createdLockFile = true;
		},
		remove: () => {
			if (!createdLockFile) {
				return;
			}
			fs.unlinkSync(lockFile);
			createdLockFile = false;
		},
		exists: () => {
			if (fs.existsSync(lockFile)) {
				const data = fs.readFileSync(lockFile, 'utf-8');
				return data === version;
			}
		},
	};
}

function chmodX(filename: string) {
	const s = fs.statSync(filename);
	const newMode = s.mode | 64 | 8 | 1;
	if (s.mode === newMode) return;
	const base8 = newMode.toString(8).slice(-3);
	fs.chmodSync(filename, base8);
}
