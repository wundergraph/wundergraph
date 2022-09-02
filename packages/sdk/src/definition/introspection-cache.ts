import { Api, ApiType, DataSource, IntrospectionConfiguration } from './index';
import path from 'path';
import fs from 'fs';
import fsP from 'fs/promises';
import objectHash from 'object-hash';
import { FieldConfiguration, TypeConfiguration } from '@wundergraph/protobuf';

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
	cacheKey: string
): Promise<boolean> => {
	const cachedIntrospectionString = await readIntrospectionCacheFile(cacheKey);
	const actualApiCacheEntry = toCacheEntry(api);
	const actualApiCacheEntryString = JSON.stringify(actualApiCacheEntry);

	if (actualApiCacheEntryString === cachedIntrospectionString) {
		return false;
	}

	// we only write to the file system if the introspection result has changed.
	// A file change will trigger a rebuild of the entire WunderGraph config.
	await writeIntrospectionCacheFile(cacheKey, actualApiCacheEntryString);

	return true;
};

export const introspectInInterval = async <Introspection extends IntrospectionConfiguration, A extends ApiType>(
	intervalInSeconds: number,
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api<A>>
) => {
	setInterval(async () => {
		try {
			const cacheKey = objectHash(introspection);
			const api = await generator(introspection);
			const updated = await updateIntrospectionCache(api, cacheKey);
			if (updated) {
				console.log(`Introspection cache updated. Trigger rebuild of WunderGraph config.`);
			}
		} catch (e) {
			console.error('Error during introspection cache update', e);
		}
	}, intervalInSeconds * 1000);
};
