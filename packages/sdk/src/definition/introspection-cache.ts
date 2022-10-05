import {
	Api,
	ApiType,
	DataSource,
	IntrospectionConfiguration,
	WG_DATA_SOURCE_POLLING_MODE,
	WG_DEV_FIRST_RUN,
	WG_ENABLE_INTROSPECTION_CACHE,
} from './index';
import path from 'path';
import fs from 'fs';
import fsP from 'fs/promises';
import { FieldConfiguration, TypeConfiguration } from '@wundergraph/protobuf';
import objectHash from 'object-hash';
import { Logger } from '../logger/logger';

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
	const cacheFile = path.join('generated', 'introspection', 'cache', `${cacheKey}.json`);
	if (fs.existsSync(cacheFile)) {
		return fsP.readFile(cacheFile, 'utf8');
	}
	return '';
};

export const writeIntrospectionCacheFile = async (cacheKey: string, content: string): Promise<void> => {
	const cacheFile = path.join('generated', 'introspection', 'cache', `${cacheKey}.json`);
	return fsP.writeFile(cacheFile, content, { encoding: 'utf8' });
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
	setInterval(async () => {
		try {
			const api = await generator(introspection);
			const updated = await updateIntrospectionCache(api, introspectionCacheKey);
			if (updated) {
				Logger().info(`Introspection cache updated. Trigger rebuild of WunderGraph config.`);
			}
		} catch (e) {
			Logger().error('Error during introspection cache update', e);
		}
	}, intervalInSeconds * 1000);
};

export const introspectWithCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api<A>>
): Promise<Api<A>> => {
	const isIntrospectionCacheEnabled =
		WG_ENABLE_INTROSPECTION_CACHE && introspection.introspection?.disableCache !== true;
	const cacheKey = objectHash(introspection);

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

	/**
	 * The introspection cache is only used in development mode `wunderctl up`.
	 * We try to early return with a cached introspection result.
	 * When the user runs `wunderctl up` for the first time, we disable the cache
	 * so the user can be sure that the introspection is up to date. If the API is down during development
	 * we try to fallback to the previous introspection result.
	 */

	if (isIntrospectionCacheEnabled) {
		const cacheEntryString = await readIntrospectionCacheFile(cacheKey);
		if (cacheEntryString) {
			const cacheEntry = JSON.parse(cacheEntryString) as IntrospectionCacheFile<A>;
			return fromCacheEntry<A>(cacheEntry);
		} else {
			console.error('Invalid cached introspection result. Revalidate introspection...');
		}
	}

	try {
		// generate introspection from scratch
		const api = await generator(introspection);

		// prefill cache with new introspection result (only for development mode)
		if (WG_DEV_FIRST_RUN) {
			try {
				const cacheEntry = toCacheEntry<A>(api);
				await writeIntrospectionCacheFile(cacheKey, JSON.stringify(cacheEntry));
			} catch (e) {}
		}

		return api;
	} catch (e) {
		// fallback to old introspection result (only for development mode)
		if (WG_DEV_FIRST_RUN) {
			Logger().error('Could not introspect the api. Trying to fallback to old introspection result: ', e);
			const cacheEntryString = await readIntrospectionCacheFile(cacheKey);
			if (cacheEntryString) {
				Logger().info('Fallback to old introspection result');
				const cacheEntry = JSON.parse(cacheEntryString) as IntrospectionCacheFile<A>;
				return fromCacheEntry<A>(cacheEntry);
			}
			Logger().error('Could not fallback to old introspection result');
		}
		throw e;
	}
};
