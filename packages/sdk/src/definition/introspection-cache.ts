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

/**
 * Introspection cache
 * =================================
 *
 * The introspection cache stores introspection results for APIs ready to be used, to allow for
 * faster reloads/startup times. No intermediate data is stored, only the final introspection result.
 *
 * Cache keys are derived so that when the local data / configuration for an API changes, the derived
 * key is different. Special care must be taken for configurations that reference the environment (using the
 * resolved environment variable, NOT the variable name and default value) as well as for Introspection subclasses
 * that use function pointers (objectHash cannot know what the function returns, so the hash is based on the function name
 * and won't change if the return value is different).
 *
 * Note that there's no way to find out wether a remote API has changed, so we make some assumptions to
 * walk the fine line between responsiveness and correctness.
 *
 * There are 3 different types of sources when it comes to API introspection, and we use different caching
 * strategies for these:
 *
 * ## Introspection from data coming from the filesystem
 *
 * There are some API types (like OpenAPI) where all we use for introspection comes from the local filesystem.
 * This means that we know for sure that if the local data hasn't changed, the introspection will return the same
 * value. For this type of sources, we cache the value forever.
 *
 * ## Introspection from data coming from remote sources
 *
 * Other APIs, like GraphQL, might produce a different introspection result when either the local data changes
 * (e.g. custom scalars) or when changes are made to the remote end. There's no way to derive a perfect cache key
 * for these, so we cache them. Notice that if introspection fails and the cache is enabled, we try to load a
 * cached result ignoring its expiration as a fallback.
 *
 * ## Introspection from data coming from remote sources IN THE LOCAL NETWORK
 *
 * There'a a subset of APIs coming from remote data that warrant special consideration: those coming off the
 * local network (including localhost). This have a higher chance that someone working on a WunderGraph app
 * and an API using these network addresses is also making changes to the API, while at the same time should
 * be faster to introspect than APIs further away. To provide a better experience for this use case, we always
 * try to introspect APIs coming from the local network, ignoring the cache, but falling back to it if the
 * introspection fails.
 *
 *
 * # Polling
 *
 * Additionally, the introspection cache implements an optional polling mechanism that users can opt into when
 * defining their API. This causes the remote API to be periodically polled and introspected. If the result is
 * different that what we have in the cache, we update the cache entry and the Go side responds by reloading
 * the development server.
 */

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
