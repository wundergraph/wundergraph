import {
	Api,
	ApiType,
	DatabaseIntrospection,
	DataSource,
	GraphQLFederationIntrospection,
	GraphQLIntrospection,
	IntrospectionConfiguration,
	PrismaIntrospection,
	WG_DATA_SOURCE_POLLING_MODE,
	WG_ENABLE_INTROSPECTION_CACHE,
	WG_ENABLE_INTROSPECTION_OFFLINE,
} from './index';
import fs from 'fs/promises';

import objectHash from 'object-hash';

import { FieldConfiguration, TypeConfiguration } from '@wundergraph/protobuf';
import { loadFile } from '../codegen/templates/typescript';
import { resolveVariable } from '../configure/variables';
import { LocalCache } from '../localcache';
import { Logger } from '../logger';
import { onParentProcessExit } from '../utils/process';

export interface IntrospectionCacheFile<A extends ApiType> {
	version: '1.0.0';
	schema: string;
	dataSources: DataSource<A>[];
	fields: FieldConfiguration[];
	types: TypeConfiguration[];
	interpolateVariableDefinitionAsJSON: string[];
	customJsonScalars: string[] | undefined;
}

export function toCacheEntry<T extends ApiType>(api: Api<T>): IntrospectionCacheFile<T> {
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

export function fromCacheEntry<A extends ApiType>(cache: IntrospectionCacheFile<A>): Api<A> {
	return new Api<A>(
		cache.schema,
		cache.dataSources,
		cache.fields,
		cache.types,
		cache.interpolateVariableDefinitionAsJSON,
		cache.customJsonScalars
	);
}

export const updateIntrospectionCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	api: Api<A>,
	cacheKey: string
): Promise<boolean> => {
	const wgDirAbs = process.env.WG_DIR_ABS!;
	const cache = new LocalCache(wgDirAbs).bucket('introspection');
	const cached = await cache.get(cacheKey);
	const data = JSON.stringify(toCacheEntry(api));
	if (cached !== data) {
		cache.set(cacheKey, data);
		return true;
	}
	return false;
};

export const introspectInInterval = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	intervalInSeconds: number,
	configuration: IntrospectionCacheConfiguration,
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api<A>>
) => {
	const pollingRunner = async () => {
		try {
			const cacheKey = introspectionCacheConfigurationKey(introspection, configuration);
			const api = await generator(introspection);
			const updated = await updateIntrospectionCache(api, cacheKey);
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

export interface IntrospectionCacheConfiguration {
	keyInput: string;
	local?: boolean;
}

const introspectionCacheConfigurationKey = <Introspection extends IntrospectionConfiguration>(
	introspection: Introspection,
	config: IntrospectionCacheConfiguration
) => {
	return objectHash([config.keyInput, introspection]);
};

export const introspectWithCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	introspection: Introspection,
	configuration: IntrospectionCacheConfiguration,
	generator: (introspection: Introspection) => Promise<Api<A>>
): Promise<Api<A>> => {
	const wgDirAbs = process.env.WG_DIR_ABS!;
	const cache = new LocalCache(wgDirAbs).bucket('introspection');
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
		const cached = (await cache.getJSON(cacheKey)) as IntrospectionCacheFile<A>;
		if (cached) {
			return fromCacheEntry<A>(cached);
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
		await cache.setJSON(cacheKey, toCacheEntry<A>(api));
	}

	return api;
};
