import {
	Api,
	ApiType,
	DataSource,
	IntrospectionConfiguration,
	WG_DATA_SOURCE_POLLING_MODE,
	WG_ENABLE_INTROSPECTION_CACHE,
	WG_ENABLE_INTROSPECTION_OFFLINE,
} from './index';

import objectHash from 'object-hash';

import { FieldConfiguration, TypeConfiguration } from '@wundergraph/protobuf';
import { LocalCache, LocalCacheBucket } from '../localcache';
import { Logger } from '../logger';
import { onParentProcessExit } from '../utils/process';

interface IntrospectionCacheFile<A extends ApiType> {
	version: '1.0.0';
	schema: string;
	dataSources: DataSource<A>[];
	fields: FieldConfiguration[];
	types: TypeConfiguration[];
	interpolateVariableDefinitionAsJSON: string[];
	customJsonScalars: string[] | undefined;
}

function toCacheEntry<T extends ApiType>(api: Api<T>): IntrospectionCacheFile<T> {
	return {
		version: '1.0.0',
		schema: api.Schema,
		dataSources: api.DataSources,
		fields: api.Fields,
		types: api.Types,
		interpolateVariableDefinitionAsJSON: api.interpolateVariableDefinitionAsJSON,
		customJsonScalars: api.CustomJsonScalars,
	};
}

function fromCacheEntry<A extends ApiType>(cache: IntrospectionCacheFile<A>): Api<A> {
	return new Api<A>(
		cache.schema,
		cache.dataSources,
		cache.fields,
		cache.types,
		cache.interpolateVariableDefinitionAsJSON,
		cache.customJsonScalars
	);
}

const updateIntrospectionCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	api: Api<A>,
	bucket: LocalCacheBucket,
	cacheKey: string,
	ttlSeconds: number
): Promise<boolean> => {
	const cached = await bucket.get(cacheKey);
	const data = JSON.stringify(toCacheEntry(api));
	if (cached !== data) {
		bucket.set(cacheKey, data, { ttlSeconds: ttlSeconds });
		return true;
	}
	return false;
};

const introspectInInterval = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	intervalInSeconds: number,
	configuration: IntrospectionCacheConfiguration,
	introspection: Introspection,
	bucket: LocalCacheBucket,
	generator: (introspection: Introspection) => Promise<Api<A>>
) => {
	const ttlSeconds = introspectionCacheConfigurationTtl(configuration);
	const pollingRunner = async () => {
		try {
			const cacheKey = introspectionCacheConfigurationKey(introspection, configuration);
			const api = await generator(introspection);
			const updated = await updateIntrospectionCache(api, bucket, cacheKey, ttlSeconds);
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

/*
 * CachedDataSource indicates where the data that we're going to cache comes from
 *
 * - localFilesystem: indicates all the data comes from the local filesystem and
 * we can determine with total certainty when it has changed, hence we can cache
 * the key forever
 *
 * - localNetwork: indicates the data comes from a remote end, but it's in localhost
 * or a local network address, which suggests it's fast to regenerate as well as
 * that the remote data might change frequently (e.g. a user developing their GraphQL
 * API at the same time as the WunderGraph app)
 *
 * - remote: indicates the data comes from a remote end, but it's not a local network
 * address, hence it's assumed to be expensive to recalculate
 */

type CachedDataSource = 'localFilesystem' | 'localNetwork' | 'remote';

export interface IntrospectionCacheConfiguration {
	/*
	 * keyInput represents an piece that should be considered when calculating the
	 * cache key, to avoid calculating equal keys for different data (e.g. objectHash
	 * will hash functions with the same name to the same value, but they might return
	 * different data)
	 */
	keyInput: string;
	dataSource?: CachedDataSource;
}

const introspectionCacheConfigurationKey = <Introspection extends IntrospectionConfiguration>(
	introspection: Introspection,
	config: IntrospectionCacheConfiguration
) => {
	return objectHash([config.keyInput, introspection]);
};

const introspectionCacheConfigurationDataSource = (config: IntrospectionCacheConfiguration) => {
	return config?.dataSource ?? 'remote';
};

const introspectionCacheConfigurationTtl = (config: IntrospectionCacheConfiguration) => {
	switch (introspectionCacheConfigurationDataSource(config)) {
		case 'localFilesystem':
			// Cache forever
			return 0;
		case 'localNetwork':
			// Cache for a day, but notice that we try to skip the cache
			// for these ones, favoring refetching
			return 24 * 60 * 60;
		case 'remote':
			// Cache for an hour
			return 60 * 60;
	}
};

export const introspectWithCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	introspection: Introspection,
	configuration: IntrospectionCacheConfiguration,
	generator: (introspection: Introspection) => Promise<Api<A>>
): Promise<Api<A>> => {
	const cache = new LocalCache().bucket('introspection');
	const dataSource = introspectionCacheConfigurationDataSource(configuration);
	const cacheKey = introspectionCacheConfigurationKey(introspection, configuration);

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
				configuration,
				introspection,
				cache,
				generator
			);
		}
		return {} as Api<A>;
	}

	const isIntrospectionDisabledBySource = introspection.introspection?.disableCache === true;
	const isIntrospectionEnabledByEnv = WG_ENABLE_INTROSPECTION_CACHE;
	const isIntrospectionCacheEnabled = !isIntrospectionDisabledBySource && isIntrospectionEnabledByEnv;

	/**
	 * If the cache is enabled and we either:
	 * - Are in cache only mode
	 * - The source is not the local network, try the cache first
	 *
	 * Data from the local filesystem won't match if it changed, while remote
	 * data is expensive to regenerate. We try to refetch data coming from
	 * the local network to avoid problems with a stale cache.
	 */

	if (isIntrospectionCacheEnabled) {
		if (WG_ENABLE_INTROSPECTION_OFFLINE || dataSource !== 'localNetwork') {
			const cached = (await cache.getJSON(cacheKey)) as IntrospectionCacheFile<A>;
			if (cached) {
				return fromCacheEntry<A>(cached);
			}
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

	let api: Api<A> | undefined;
	try {
		api = await generator(introspection);
	} catch (e: any) {
		/*
		 * If the introspection cache is enabled, try to fallback to it ignoring ttl
		 */
		if (isIntrospectionCacheEnabled) {
			const result = await cache.getJSON(cacheKey, { ignoreTtl: true });
			if (result) {
				api = fromCacheEntry<A>(result as IntrospectionCacheFile<A>);
			}
		}

		if (!api) {
			throw e;
		}
	}

	/*
	 * We got a result. If the cache is enabled, populate it
	 */
	if (isIntrospectionCacheEnabled && api) {
		await cache.setJSON(cacheKey, toCacheEntry<A>(api), {
			ttlSeconds: introspectionCacheConfigurationTtl(configuration),
		});
	}

	return api;
};
