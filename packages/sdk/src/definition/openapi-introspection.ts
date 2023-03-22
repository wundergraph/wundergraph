import path from 'path';
import process from 'node:process';
import fs from 'fs/promises';

import { OpenAPIIntrospection, OpenAPIIntrospectionSource, RESTApi } from './index';
import { openApiSpecificationToRESTApiObject } from '../v2openapi';
import { introspectWithCache } from './introspection-cache';

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

export const openApi = async (introspection: OpenAPIIntrospection): Promise<RESTApi> => {
	const spec = await loadOpenApi(introspection.source);
	const configuration = { keyInput: spec, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: OpenAPIIntrospection): Promise<RESTApi> => {
			return await openApiSpecificationToRESTApiObject(spec, introspection);
		}
	);
};
