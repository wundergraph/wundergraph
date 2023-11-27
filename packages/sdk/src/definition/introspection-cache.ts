import { setTimeout } from 'node:timers/promises';

import {
	Api,
	ApiIntrospectionOptions,
	ApiType,
	DataSource,
	IntrospectionConfiguration,
	WG_DATA_SOURCE_DEFAULT_POLLING_INTERVAL_SECONDS,
	WG_DATA_SOURCE_POLLING_MODE,
	WG_ENABLE_INTROSPECTION_CACHE,
	WG_ENABLE_INTROSPECTION_OFFLINE,
	WG_INTROSPECTION_CACHE_SKIP,
} from './index';

import objectHash from 'object-hash';

import { FieldConfiguration, TypeConfiguration } from '@wundergraph/protobuf';
import { LocalCache, LocalCacheBucket } from '../localcache';
import { Logger } from '../logger';
import { onParentProcessExit } from '../utils/process';
import { toJson } from '../utils/tojson';

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
 * ## Initial introspection during wunderctl up
 *
 * When wunderctl up starts, it always tries to introspect the APIs again, to make sure we're not using stale
 * data (the remote API might have changed). If this initial introspection fails, we fallback to the cache.
 * Subsequent introspections without restarting wunderctl will use the cache.
 *
 * ## Data source types
 *
 * There are different types of sources when it comes to API introspection, and we use different caching
 * strategies for these:
 *
 * ## Introspection from data coming from the filesystem
 *
 * There are some API types (like OpenAPI) where all we use for introspection comes from the local filesystem.
 * This means that we know for sure that if the local data hasn't changed, the introspection will return the same
 * value. For this type of sources, we cache the value forever.
 *
 * ## Introspection from data remote sources
 *
 * Other APIs, like GraphQL, might produce a different introspection result when either the local data changes
 * (e.g. custom scalars) or when changes are made to the remote end. There's no way to derive a perfect cache key
 * for these, so we cache them. Notice that if introspection fails and the cache is enabled, we try to load a
 * cached result ignoring its expiration as a fallback.
 *
 * # Skipping
 *
 * When starting wunderctl with wunderctl up, the first time the script for generating the config runs, we
 * skip the cache lookup to refresh the data.
 *
 * # Polling
 *
 * Additionally, the introspection cache implements an optional polling mechanism that users can opt into when
 * defining their API. This causes the remote API to be periodically polled and introspected. If the result is
 * different that what we have in the cache, we update the cache entry and the Go side responds by reloading
 * the development server. Polling is enabled by default for all remote APIs, every 5 seconds. This can be overridden
 * or disabled by the user, either on a per-API basis or globally.
 */

interface IntrospectionCacheFile<A extends ApiType> {
	version: '1.0.0';
	schema: string;
	namespace: string;
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
		namespace: api.Namespace,
		dataSources: api.DataSources,
		fields: api.Fields,
		types: api.Types,
		interpolateVariableDefinitionAsJSON: api.interpolateVariableDefinitionAsJSON,
		customJsonScalars: Array.from(api.CustomJsonScalars || []),
	};
}

function fromCacheEntry<A extends ApiType>(cache: IntrospectionCacheFile<A>): Api<A> {
	return new Api<A>(
		cache.schema,
		cache.namespace,
		cache.dataSources,
		cache.fields,
		cache.types,
		cache.interpolateVariableDefinitionAsJSON,
		new Set<string>(cache.customJsonScalars)
	);
}

const updateIntrospectionCache = async <TApi extends ApiType>(
	api: Api<TApi>,
	bucket: LocalCacheBucket,
	cacheKey: string
): Promise<boolean> => {
	const cached = await bucket.get(cacheKey);
	const data = await toJson(toCacheEntry(api));
	if (cached !== data) {
		return bucket.set(cacheKey, data);
	}
	return false;
};

type ApiGenerator<
	TIntrospection extends IntrospectionConfiguration,
	TOptions extends ApiIntrospectionOptions,
	TApiType extends ApiType
> = (introspection: TIntrospection, options: TOptions) => Promise<Api<TApiType>>;

/**
 * introspectInInterval runs introspection at a regular interval forever. It only
 * stops if the parent process exits
 */
const introspectInInterval = async <
	TIntrospection extends IntrospectionConfiguration,
	TOptions extends ApiIntrospectionOptions,
	TApiType extends ApiType
>(
	intervalInSeconds: number,
	configuration: IntrospectionCacheConfiguration,
	introspection: TIntrospection,
	bucket: LocalCacheBucket,
	generator: ApiGenerator<TIntrospection, TOptions, TApiType>,
	options: TOptions
) => {
	let continuePolling = true;

	// Exit the long-running introspection poller when wunderctl exited without the chance to kill the child processes
	onParentProcessExit(() => {
		continuePolling = false;
	});

	while (continuePolling) {
		await setTimeout(intervalInSeconds * 1000);
		try {
			const cacheKey = introspectionCacheConfigurationKey(introspection, configuration, options);
			const api = await generator(introspection, options);
			const updated = await updateIntrospectionCache(api, bucket, cacheKey);
			if (updated) {
				Logger.info(`Introspection cache updated. Trigger rebuild of WunderGraph config.`);
			}
		} catch (e) {
			Logger.error(`error polling API: ${e}`);
		}
	}
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

const introspectionCacheConfigurationKey = <
	TIntrospection extends IntrospectionConfiguration,
	TOptions extends ApiIntrospectionOptions
>(
	introspection: TIntrospection,
	config: IntrospectionCacheConfiguration,
	options: TOptions
) => {
	return objectHash([config.keyInput, introspection, options]);
};

const introspectionCacheConfigurationDataSource = (config: IntrospectionCacheConfiguration) => {
	return config?.dataSource ?? 'remote';
};

async function introspectWithCacheOptions<
	TIntrospection extends IntrospectionConfiguration,
	TOptions extends ApiIntrospectionOptions,
	TApiType extends ApiType
>(
	introspection: TIntrospection,
	configuration: IntrospectionCacheConfiguration,
	generator: ApiGenerator<TIntrospection, TOptions, TApiType>,
	options: TOptions
) {
	const cache = new LocalCache().bucket('introspection');
	const dataSource = introspectionCacheConfigurationDataSource(configuration);
	const cacheKey = introspectionCacheConfigurationKey(introspection, configuration, options);

	/**
	 * This section is only executed when WG_DATA_SOURCE_POLLING_MODE is set to 'true'
	 * The return value is ignorable because we don't use it (polling runs as a separate process).
	 */
	if (WG_DATA_SOURCE_POLLING_MODE) {
		// For sources from the local network, use the default polling interval, since they're more
		// likely to change. Otherwise, use polling only when it's explicitly enabled.
		const defaultPollingInterval = dataSource === 'localNetwork' ? WG_DATA_SOURCE_DEFAULT_POLLING_INTERVAL_SECONDS : 0;
		const pollingInterval = introspection.introspection?.pollingIntervalSeconds ?? defaultPollingInterval;
		if (pollingInterval > 0) {
			await introspectInInterval(pollingInterval, configuration, introspection, cache, generator, options);
		}
		return {} as Api<TApiType>;
	}

	const isIntrospectionDisabledBySource = introspection.introspection?.disableCache === true;
	const isIntrospectionEnabledByEnv = WG_ENABLE_INTROSPECTION_CACHE;
	const isIntrospectionCacheEnabled = !isIntrospectionDisabledBySource && isIntrospectionEnabledByEnv;

	/**
	 * If the cache is enabled and we either:
	 *
	 * - Are in cache only mode
	 * - The source data comes from the local filesystem
	 * - WG_INTROSPECTION_CACHE_SKIP is disabled
	 *
	 * We try the cache first
	 *
	 * Data from the local filesystem won't match if it changed, while remote
	 * data is expensive to regenerate. We use WG_INTROSPECTION_CACHE_SKIP on the first
	 * run to avoid problems with a stale cache.
	 */

	if (isIntrospectionCacheEnabled) {
		if (WG_ENABLE_INTROSPECTION_OFFLINE || dataSource === 'localFilesystem' || !WG_INTROSPECTION_CACHE_SKIP) {
			const cached = (await cache.getJSON(cacheKey)) as IntrospectionCacheFile<TApiType>;
			if (cached) {
				return fromCacheEntry<TApiType>(cached);
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

	let api: Api<TApiType> | undefined;
	try {
		api = await generator(introspection, options);
	} catch (e: any) {
		/*
		 * If the introspection cache is enabled, try to fallback to it
		 */
		if (isIntrospectionCacheEnabled) {
			const result = await cache.getJSON(cacheKey);
			if (result) {
				api = fromCacheEntry<TApiType>(result as IntrospectionCacheFile<TApiType>);
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
		await cache.setJSON(cacheKey, toCacheEntry<TApiType>(api));
	}

	return api;
}

export const introspectWithCache = <
	TIntrospection extends IntrospectionConfiguration,
	TOptions extends ApiIntrospectionOptions,
	TApiType extends ApiType
>(
	introspection: TIntrospection,
	configuration: IntrospectionCacheConfiguration,
	generator: ApiGenerator<TIntrospection, TOptions, TApiType>
): ((options: TOptions) => Promise<Api<TApiType>>) => {
	return (options: TOptions) => {
		return introspectWithCacheOptions(introspection, configuration, generator, options);
	};
};
