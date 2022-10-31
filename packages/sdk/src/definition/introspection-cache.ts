import {
	Api,
	ApiType,
	DataSource,
	IntrospectionConfiguration,
	WG_DATA_SOURCE_POLLING_MODE,
	WG_ENABLE_INTROSPECTION_CACHE,
	WG_ENABLE_INTROSPECTION_OFFLINE,
} from './index';
import * as crypto from 'crypto';
import path from 'path';
import fsP from 'fs/promises';
import { FieldConfiguration, TypeConfiguration } from '@wundergraph/protobuf';
import { Logger } from '../logger';
import { onParentProcessExit } from '../utils/process';

export interface IntrospectionCacheFile<A extends ApiType> {
	version: '1.0.0';
	schema: string;
	dataSources: DataSource<A>[];
	fields: FieldConfiguration[];
	types: TypeConfiguration[];
	interpolateVariableDefinitionAsJSON: string[];
}

export function toCacheEntry<T extends ApiType>(api: Api<T>): IntrospectionCacheFile<T> {
	return {
		version: '1.0.0',
		schema: api.Schema,
		dataSources: api.DataSources,
		fields: api.Fields,
		types: api.Types,
		interpolateVariableDefinitionAsJSON: api.interpolateVariableDefinitionAsJSON,
	};
}

export function fromCacheEntry<A extends ApiType>(cache: IntrospectionCacheFile<A>): Api<A> {
	return new Api<A>(
		cache.schema,
		cache.dataSources,
		cache.fields,
		cache.types,
		cache.interpolateVariableDefinitionAsJSON
	);
}

export const readIntrospectionCacheFile = async (cacheKey: string): Promise<string> => {
	const cacheFile = path.join('cache', 'introspection', `${cacheKey}.json`);
	try {
		return await fsP.readFile(cacheFile, 'utf8');
	} catch (e) {
		if (e instanceof Error && e.message.startsWith('ENOENT')) {
			// File does not exist
			return '';
		}
		throw e;
	}
};

export const writeIntrospectionCacheFile = async (cacheKey: string, content: string): Promise<void> => {
	const cacheFile = path.join('cache', 'introspection', `${cacheKey}.json`);
	try {
		return await fsP.writeFile(cacheFile, content, { encoding: 'utf8' });
	} catch (e) {
		if (e instanceof Error && e.message.startsWith('ENOENT')) {
			const dir = path.dirname(cacheFile);
			try {
				await fsP.mkdir(dir, { recursive: true });
			} catch (de) {
				Logger.error(`Error creating cache directory: ${de}`);
			}
			// Now try again. Avoid calling writeIntrospectionCacheFile(), otherwise
			// a bug could end up causing infinite recursion instead of a a non-working
			// cache
			return await fsP.writeFile(cacheFile, content, { encoding: 'utf8' });
		}
		// Could not write cache file, rethrow original error
		throw e;
	}
};

export const updateIntrospectionCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	api: Api<A>,
	introspectionCacheKey: string
): Promise<boolean> => {
	const cachedIntrospectionString = await readIntrospectionCacheFile(introspectionCacheKey);
	const actualApiCacheEntry = toCacheEntry(api);
	const actualApiCacheEntryString = JSON.stringify(actualApiCacheEntry);

	if (actualApiCacheEntryString === cachedIntrospectionString) {
		return false;
	}

	// we only write to the file system if the introspection result has changed.
	// A file change will trigger a rebuild of the entire WunderGraph config.
	await writeIntrospectionCacheFile(introspectionCacheKey, actualApiCacheEntryString);

	return true;
};

export const introspectInInterval = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	intervalInSeconds: number,
	introspectionCacheKey: string,
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api<A>>
) => {
	const pollingRunner = async () => {
		try {
			const api = await generator(introspection);
			const updated = await updateIntrospectionCache(api, introspectionCacheKey);
			if (updated) {
				Logger.info(`Introspection cache updated. Trigger rebuild of WunderGraph config.`);
			}
		} catch (e) {
			Logger.error('Error during introspection cache update', e);
		}
	};

	const pollingInterval = setInterval(pollingRunner, intervalInSeconds * 1000);

	// Exit the long-running introspection poller when wunderctl exited without the chance to kill the child processes
	onParentProcessExit(() => {
		pollingInterval.unref();
	});
};

export const introspectWithCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api<A>>
): Promise<Api<A>> => {
	const cacheKey = await makeCacheKey(introspection);

	/**
	 * This section is only executed when WG_DATA_SOURCE_POLLING_MODE is set to 'true'
	 * The return value is ignorable because we don't use it.
	 */
	if (WG_DATA_SOURCE_POLLING_MODE) {
		if (
			introspection.introspection?.pollingIntervalSeconds !== undefined &&
			introspection.introspection?.pollingIntervalSeconds > 0
		) {
			await introspectInInterval(
				introspection.introspection?.pollingIntervalSeconds,
				cacheKey,
				introspection,
				generator
			);
		}
		return {} as Api<A>;
	}

	const isIntrospectionDisabledBySource = introspection.introspection?.disableCache === true;
	const isIntrospectionEnabledByEnv = WG_ENABLE_INTROSPECTION_CACHE;
	const isIntrospectionCacheEnabled = !isIntrospectionDisabledBySource && isIntrospectionEnabledByEnv;

	/**
	 * As long as the cache is enabled, always try to hit it first
	 */

	if (isIntrospectionCacheEnabled) {
		const cacheEntryString = await readIntrospectionCacheFile(cacheKey);
		if (cacheEntryString) {
			const cacheEntry = JSON.parse(cacheEntryString) as IntrospectionCacheFile<A>;
			return fromCacheEntry<A>(cacheEntry);
		}
	}

	/*
	 * At this point, we don't have a cache entry for this. If we're in cache exclusive
	 * mode, fail here. Otherwise generate introspection from scratch. Then cache it.
	 */

	if (WG_ENABLE_INTROSPECTION_OFFLINE) {
		throw new Error(
			`Could not load introspection from cache for ${JSON.stringify(
				introspection
			)} and network requests are disabled in offline mode`
		);
	}

	const api = await generator(introspection);

	/*
	 * We got a result. If the cache is enabled, populate it
	 */
	if (isIntrospectionCacheEnabled) {
		try {
			const cacheEntry = toCacheEntry<A>(api);
			await writeIntrospectionCacheFile(cacheKey, JSON.stringify(cacheEntry));
		} catch (e) {
			Logger.error(`Error storing cache: ${e}`);
		}
	}

	return api;
};

async function fileHash(hash: crypto.Hash, potentialPath: string): Promise<void> {
	try {
		let buffer = await fsP.readFile(potentialPath);
		if (buffer) {
			hash.update(buffer);
		}
	} catch (e: any) {
		// If the error is because the entry does not exist or the
		// entry is a directory, ignore it. Otherwise throw.
		if (!(e instanceof Error && (e.message.indexOf('ENOENT') >= 0 || e.message.indexOf('ISDIR') >= 0))) {
			throw e;
		}
	}
}

async function objectHash(hash: crypto.Hash, object: any): Promise<void> {
	for (const k in object) {
		hash.update(k);
		const v = object[k];
		if (typeof v === 'object' && v !== null) {
			await objectHash(hash, v);
		} else if (object.hasOwnProperty(k)) {
			hash.update(typeof v === 'undefined' ? 'undefined ' : v.toString());
			if (typeof v === 'string') {
				// The value might reference a file. Try to read
				// and hash it.
				await fileHash(hash, v);
				if (process.env.WG_DIR_ABS) {
					await fileHash(hash, path.join(process.env.WG_DIR_ABS, v));
				}
			}
		}
	}
}

async function makeCacheKey(object: any): Promise<string> {
	let hash = crypto.createHash('sha1');
	await objectHash(hash, object);
	return hash.digest('hex');
}
