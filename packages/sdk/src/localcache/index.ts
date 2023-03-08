import syncFs from 'fs';
import fs from 'fs/promises';
import path from 'path';

import objectHash from 'object-hash';
import semver from 'semver';

import logger from '../logger';
import { SDK_VERSION } from '../version';

const cacheDirname = 'cache';

export class LocalCache {
	private readonly root: string = '';

	constructor(wgDir: string) {
		const sdkVersion = SDK_VERSION;
		const root = path.join(wgDir, cacheDirname);
		let version: string;
		if (sdkVersion && semver.valid(sdkVersion)) {
			try {
				this.cleanup(root, sdkVersion);
			} catch (e: any) {
				if (!(e instanceof Error) || !e.message.includes('ENOENT')) {
					throw e;
				}
			}
			version = sdkVersion;
		} else {
			// Unknown version?
			version = '_';
		}
		this.root = path.join(root, version);
	}

	private cleanup(root: string, sdkVersion: string) {
		// Cleanup caches for older versions
		for (const entry of syncFs.readdirSync(root)) {
			if (!semver.valid(entry)) {
				continue;
			}
			if (semver.lt(entry, sdkVersion)) {
				syncFs.rmSync(path.join(root, entry), { recursive: true, force: true });
			}
		}
	}

	bucket(name: string) {
		return new Bucket(path.join(this.root, path.normalize(name)));
	}
}

class Bucket {
	constructor(private dir: string) {}

	private keyPath(key: any): string {
		return path.join(this.dir, objectHash(key));
	}

	private hasExpired(expiration: number, ignoreTtl?: boolean) {
		return expiration == 0 || ignoreTtl || Date.now() / 1000 <= expiration;
	}

	async has(key: any, ignoreTtl?: boolean): Promise<boolean> {
		const filePath = this.keyPath(key);
		try {
			const blob = await fs.readFile(filePath);
			const expiration = blob.readUInt32LE();
			return !this.hasExpired(expiration, ignoreTtl);
		} catch (e: any) {
			return false;
		}
	}

	async get(key: any, ignoreTtl?: boolean): Promise<string | undefined> {
		const filePath = this.keyPath(key);
		try {
			const blob = await fs.readFile(filePath);
			const expiration = blob.readUInt32LE();
			if (!this.hasExpired(expiration, ignoreTtl)) {
				return blob.toString('utf-8', 4);
			}
		} catch (e: any) {
			if (e instanceof Error && e.message.includes('ENOENT')) {
				// File does not exist
				return undefined;
			}
			throw e;
		}
		return undefined;
	}

	async write(filePath: string, data: Buffer): Promise<void> {
		try {
			return await fs.writeFile(filePath, data);
		} catch (e) {
			if (e instanceof Error && e.message.includes('ENOENT')) {
				const dir = path.dirname(filePath);
				try {
					await fs.mkdir(dir, { recursive: true });
				} catch (de) {
					logger.error(`error creating cache directory: ${de}`);
				}
				// Avoid recursive call, otherwise we could end up with infinite recursion
				return await fs.writeFile(filePath, data);
			}
			// Could not write cache file, rethrow original error
			throw e;
		}
	}

	async set(key: any, data: string, ttlSeconds?: number): Promise<void> {
		const filePath = this.keyPath(key);
		const expiration = (ttlSeconds ?? 0) > 0 ? Date.now() / 1000 + ttlSeconds! : 0;
		const expirationBuf = Buffer.alloc(4);
		expirationBuf.writeUint32LE(expiration);
		const buf = Buffer.concat([expirationBuf, Buffer.from(data, 'utf-8')]);
		try {
			await this.write(filePath, buf);
		} catch (e: any) {
			logger.error(`error storing cache entry at ${filePath}: ${e}`);
		}
	}

	async getJSON(key: any, ignoreTtl?: boolean): Promise<any> {
		const data = await this.get(key);
		if (data !== undefined) {
			try {
				return JSON.parse(data);
			} catch (e: any) {
				logger.error(`error loading JSON data from cache: ${e}`);
			}
		}
		return undefined;
	}

	async setJSON(key: any, data: any, ttlSeconds?: number): Promise<void> {
		let encoded: string;
		try {
			encoded = JSON.stringify(data);
		} catch (e: any) {
			logger.error(`error storing encoding cached data: ${e}`);
			return;
		}

		await this.set(key, encoded, ttlSeconds);
	}
}
