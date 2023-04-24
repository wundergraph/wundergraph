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
			const filePath = path.resolve(process.cwd(), source.filePath);
			return await fs.readFile(filePath, { encoding: 'utf-8' });
		case 'object':
			return JSON.stringify(source.openAPIObject);
		case 'string':
			return source.openAPISpec;
		default:
			return '';
	}
};

export const openApi = async (introspection: OpenAPIIntrospection) => {
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

export interface OpenAPIIntrospectionNew
	extends Omit<OpenAPIIntrospection, 'statusCodeUnions' | 'authentication' | 'mTLS' | 'requestTimeoutSeconds'> {
	id: string;
}

export const openApiV2 = async (introspection: OpenAPIIntrospectionNew) => {
	const spec = await loadOpenApi(introspection.source);
	const configuration = { keyInput: spec, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: OpenAPIIntrospection, _: ApiIntrospectionOptions): Promise<GraphQLApi> => {
			return await openApiSpecificationToGraphQLApi(spec, introspection);
		}
	);
};
