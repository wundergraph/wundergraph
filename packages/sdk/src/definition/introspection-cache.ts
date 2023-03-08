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
import crypto from 'crypto';
import { FieldConfiguration, TypeConfiguration } from '@wundergraph/protobuf';
import objectHash from 'object-hash';
import { LocalCache } from '../localcache';
import { Logger } from '../logger';
import { onParentProcessExit } from '../utils/process';
import { resolveVariable } from '../configure/variables';

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
	introspectionCacheKey: string
): Promise<boolean> => {
	const wgDirAbs = process.env.WG_DIR_ABS!;
	new LocalCache(wgDirAbs).bucket('introspection').setJSON(introspectionCacheKey, toCacheEntry(api));
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

const fileHash = async (filePath: string) => {
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

const urlHash = async (url: string) => {
	const filePrefix = 'file:';
	if (url.startsWith(filePrefix)) {
		const filePath = url.substring(filePrefix.length);
		return fileHash(filePath);
	}
	return url;
};

const graphqlIntrospectionHash = async (introspection: GraphQLIntrospection) => {
	const loadSchemaFromString = introspection.loadSchemaFromString;
	if (loadSchemaFromString) {
		let schema: string;
		if (typeof loadSchemaFromString === 'function') {
			schema = loadSchemaFromString();
		} else {
			schema = loadSchemaFromString;
		}
		if (schema) {
			return objectHash([schema, introspection]);
		}
	}
	const url = resolveVariable(introspection.url);
	const baseUrl = introspection.baseUrl ? resolveVariable(introspection.baseUrl) : '';
	const path = introspection.path ? resolveVariable(introspection.path) : '';
	const hash = await urlHash(url);
	const baseUrlHash = await urlHash(baseUrl + path);
	return objectHash([hash, baseUrlHash, introspection]);
};

const introspectionCacheKey = async <Introspection extends IntrospectionConfiguration>(
	introspection: Introspection
) => {
	if ('databaseURL' in introspection) {
		const databaseIntrospection = introspection as DatabaseIntrospection;
		const url = resolveVariable(databaseIntrospection.databaseURL);
		const hash = await urlHash(url);
		return objectHash([hash, databaseIntrospection]);
	}

	if ('upstreams' in introspection) {
		const federationIntrospection = introspection as GraphQLFederationIntrospection;
		const hashes: string[] = [];
		federationIntrospection.upstreams.forEach(async (upstream) => {
			hashes.push(await graphqlIntrospectionHash(upstream));
		});
		return objectHash(hashes);
	}

	if ('prismaFilePath' in introspection) {
		const prismaIntrospection = introspection as PrismaIntrospection;
		const hash = await fileHash(prismaIntrospection.prismaFilePath);
		return objectHash([hash, prismaIntrospection]);
	}

	if ('url' in introspection) {
		const graphqlIntrospection = introspection as GraphQLIntrospection;
		return graphqlIntrospectionHash(graphqlIntrospection);
	}

	return objectHash(introspection);
};

export const introspectWithCache = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api<A>>
): Promise<Api<A>> => {
	const wgDirAbs = process.env.WG_DIR_ABS!;
	const cache = new LocalCache(wgDirAbs).bucket('introspection');
	const cacheKey = await introspectionCacheKey(introspection);

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
