import path from 'path';
import process from 'node:process';
import fs from 'fs/promises';

import {
	ApiIntrospectionOptions,
	GraphQLApi,
	OpenAPIIntrospection,
	OpenAPIIntrospectionSource,
	RESTApi,
} from './index';
import { openApiSpecificationToRESTApiObject } from '../v2openapi';
import { introspectWithCache } from './introspection-cache';
import { openApiSpecificationToGraphQLApi } from '../v2openapi/omnigraph';

const loadOpenApi = async (source: OpenAPIIntrospectionSource) => {
	switch (source.kind) {
		case 'file':
			return readFile(source.filePath);
		case 'object':
			return JSON.stringify(source.openAPIObject);
		case 'string':
			return source.openAPISpec;
		default:
			return '';
	}
};

export const readFile = async (filePath: string) => {
	const fullPath = path.resolve(process.cwd(), filePath);
	return fs.readFile(fullPath, { encoding: 'utf-8' });
};

export const openApi = async (introspection: OpenAPIIntrospection): Promise<RESTApi> => {
	const spec = await loadOpenApi(introspection.source);
	const configuration = { keyInput: spec, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: OpenAPIIntrospection, _: ApiIntrospectionOptions): Promise<RESTApi> => {
			return await openApiSpecificationToRESTApiObject(spec, introspection);
		}
	);
};

export interface OpenAPIIntrospectionV2
	extends Omit<OpenAPIIntrospection, 'statusCodeUnions' | 'authentication' | 'mTLS' | 'requestTimeoutSeconds'> {
	id: string;
}

export const openApiV2 = async (introspection: OpenAPIIntrospectionV2): Promise<GraphQLApi> => {
	const spec = await loadOpenApi(introspection.source);
	const configuration = { keyInput: spec, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: OpenAPIIntrospectionV2, _: ApiIntrospectionOptions): Promise<GraphQLApi> => {
			return await openApiSpecificationToGraphQLApi(spec, introspection);
		}
	);
};
