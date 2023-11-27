import crypto from 'crypto';
import dns from 'node:dns/promises';
import fs from 'fs/promises';
import path from 'path';

import objectHash from 'object-hash';
import writeFileAtomic from 'write-file-atomic';

import logger from '../logger';
import { toJson } from '../utils/tojson';

interface CacheSetOptions {
	ttlSeconds?: number;
}

interface CacheGetOptions {
	ignoreTtl?: boolean;
}

export const fileHash = async (filePath: string) => {
	const st = await fs.stat(filePath);
	// For files up to 4K, hash the file, otherwise use the mtime
	if (st.size < 4 * 1024) {
		const buffer = await fs.readFile(filePath);
		const hash = crypto.createHash('sha1');
		hash.update(buffer);
		return hash.digest('hex');
	}
	return objectHash(st.mtime);
};

export const urlHash = async (url: string) => {
	const filePrefix = 'file:';
	if (url.startsWith(filePrefix)) {
		const filePath = url.substring(filePrefix.length);
		return fileHash(filePath);
	}
	return url;
};

function isPrivateIP(ip: string) {
	const parts = ip.split('.');
	return (
		parts[0] === '127' ||
		parts[0] == '10' ||
		(parts[0] === '172' && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31) ||
		(parts[0] === '192' && parts[1] === '168')
	);
}

/**
 * urlIsLocalNetwork returns true iff the url points to
 * an address within the local network
 */
export const urlIsLocalNetwork = async (url: string) => {
	try {
		const parsed = new URL(url);
		const addr = await dns.lookup(parsed.hostname, { family: 4 });
		return isPrivateIP(addr.address);
	} catch (e: any) {}
	return false;
};

/**
 * LocalCache implements a filesystem backed cache local to the current WunderGraph
 * project. The go side is expected to determine WUNDERGRAPH_CACHE_DIR and pass it to
 * the SDK in an environment variable.
 *
 * Each LocalCache consists of several buckets, each one mapped to a directory, that
 * store data associated to a given key. To obtain a bucket call LocalCache.bucket().
 * See LocalCacheBucket for further details.
 */
export class LocalCache {
	private readonly root: string | undefined;

	constructor() {
		this.root = process.env['WUNDERGRAPH_CACHE_DIR'];
		if (!this.root) {
			logger.debug('could not determine $WUNDERGRAPH_CACHE_DIR, caching is disabled');
		}
	}

	bucket(name: string) {
		return new LocalCacheBucket(this.root ? path.join(this.root, path.normalize(name)) : undefined);
	}
}

/**
 * LocalCacheBucket implements a cache bucket that stores keys associated to values, with an
 * optional expiration TTL. Internally, this TTL is translated to an expiration time. If TTL
 * is zero, then the cached entry never expires. To create an entry that is immediately expired
 * use a negative TTL. When looking up keys, CacheGetOptions.ignoreTTL can be used to retrieve
 * a key even if it's expired.
 */
export class LocalCacheBucket {
	constructor(private dir?: string) {}

	private keyPath(key: any): string | undefined {
		return this.dir ? path.join(this.dir, key) : undefined;
	}

	private hasExpired(expiration: number, opts?: CacheGetOptions) {
		const ignoreTtl = opts?.ignoreTtl ?? false;
		return !ignoreTtl && expiration > 0 && Date.now() / 1000 > expiration;
	}

	async has(key: any, opts?: CacheGetOptions): Promise<boolean> {
		const filePath = this.keyPath(key);
		if (filePath) {
			try {
				const blob = await fs.readFile(filePath);
				const expiration = blob.readUInt32LE();
				return !this.hasExpired(expiration, opts);
			} catch (e: any) {}
		}
		return false;
	}

	async get(key: any, opts?: CacheGetOptions): Promise<string | undefined> {
		const filePath = this.keyPath(key);
		if (!filePath) {
			return undefined;
		}
		try {
			const blob = await fs.readFile(filePath);
			if (blob.length > 4) {
				const expiration = blob.readUInt32LE();
				if (!this.hasExpired(expiration, opts)) {
					return blob.toString('utf-8', 4);
				}
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
			return await writeFileAtomic(filePath, data);
		} catch (e) {
			if (e instanceof Error && e.message.includes('ENOENT')) {
				const dir = path.dirname(filePath);
				try {
					await fs.mkdir(dir, { recursive: true });
				} catch (de) {
					logger.error(`error creating cache directory: ${de}`);
				}
				// Avoid recursive call, otherwise we could end up with infinite recursion
				return await writeFileAtomic(filePath, data);
			}
			// Could not write cache file, rethrow original error
			throw e;
		}
	}

	/**
	 * set stores the given into data into the cache associated with the provided key
	 * and overwriting previous entries under the same key
	 *
	 * @param key cache key to store the data under
	 * @param data data to store
	 * @param opts options for storing the data
	 * @returns true if the value could be stored, false otherwise
	 */
	async set(key: any, data: string, opts?: CacheSetOptions): Promise<boolean> {
		const filePath = this.keyPath(key);
		if (!filePath) {
			return false;
		}
		const ttlSeconds = opts?.ttlSeconds ?? 0;
		const expiration = ttlSeconds !== 0 ? Date.now() / 1000 + ttlSeconds : 0;
		const expirationBuf = Buffer.alloc(4);
		expirationBuf.writeUint32LE(expiration);
		const buf = Buffer.concat([expirationBuf, Buffer.from(data, 'utf-8')]);
		try {
			await this.write(filePath, buf);
		} catch (e: any) {
			logger.error(`error storing cache entry at ${filePath}: ${e}`);
			return false;
		}
		return true;
	}

	async getJSON(key: any, opts?: CacheGetOptions): Promise<any> {
		const data = await this.get(key, opts);
		if (data !== undefined) {
			try {
				return JSON.parse(data);
			} catch (e: any) {
				logger.error(`error loading JSON data from cache: ${e}`);
			}
		}
		return undefined;
	}

	/**
	 * setJSON encodes the given data with JSON, then stores the given into data into the cache
	 * associated with the provided key and overwriting previous entries under the same key
	 *
	 * @param key cache key to store the data under
	 * @param data data to store
	 * @param opts options for storing the data
	 * @returns true if the value could be stored, false otherwise
	 */

	async setJSON(key: any, data: any, opts?: CacheSetOptions): Promise<boolean> {
		let encoded: string;
		try {
			encoded = await toJson(data);
		} catch (e: any) {
			logger.error(`error storing encoding cached data: ${e}`);
			return false;
		}

		return await this.set(key, encoded, opts);
	}
}
