import path from 'path';
import process from 'node:process';
import fs from 'fs';

import { OpenAPIIntrospection, OpenAPIIntrospectionSource, RESTApi } from './index';
import { openApiSpecificationToRESTApiObject } from '../v2openapi';
import { introspectWithCache } from './introspection-cache';

export const loadOpenApi = (source: OpenAPIIntrospectionSource): string => {
	switch (source.kind) {
		case 'file':
			const filePath = path.resolve(process.cwd(), source.filePath);
			return fs.readFileSync(filePath).toString();
		case 'object':
			return JSON.stringify(source.openAPIObject);
		case 'string':
			return source.openAPISpec;
		default:
			return '';
	}
};

export const openApi = async (introspection: OpenAPIIntrospection): Promise<RESTApi> => {
	const generator = async (introspection: OpenAPIIntrospection): Promise<RESTApi> => {
		const spec = loadOpenApi(introspection.source);
		return await openApiSpecificationToRESTApiObject(spec, introspection);
	};
	// If the source is a file we have all data required to perform the instrospection
	// locally, which is also fast. Skip the cache in this case, so changes to the file
	// are picked up immediately without requiring a cache flush.
	if (introspection.source.kind === 'file') {
		return generator(introspection);
	}
	return introspectWithCache(introspection, generator);
};
