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
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import yaml from 'js-yaml';
import { HeadersBuilder } from './headers-builder';
import { getJSONSchemaOptionsFromOpenAPIOptions } from '@omnigraph/openapi';
import { loadNonExecutableGraphQLSchemaFromJSONSchemas } from '@omnigraph/json-schema';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { introspectGraphql } from './graphql-introspection';
import { WgEnv } from '../configure/options';

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

export const introspectOpenApi = async (introspection: OpenAPIIntrospection) => {
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
	extends Omit<OpenAPIIntrospection, 'statusCodeUnions' | 'authentication' | 'mTLS' | 'requestTimeoutSeconds'> {}

export const introspectOpenApiV2 = async (introspection: OpenAPIIntrospectionV2) => {
	const spec = await loadOpenApi(introspection.source);
	const configuration = { keyInput: spec, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: OpenAPIIntrospectionV2, options: ApiIntrospectionOptions): Promise<GraphQLApi> => {
			return await openApiSpecificationToGraphQLApi(spec, introspection, options.apiID!);
		}
	);
};

type OasOrSwagger = OpenAPIV3.Document | OpenAPIV2.Document;

interface OpenApiOptions {
	source: OasOrSwagger;
	endpoint?: string;
	name: string;
	operationHeaders: Record<string, string>;
}

export const openApiSpecificationToGraphQLApi = async (
	oas: string,
	introspection: OpenAPIIntrospectionV2,
	apiID: string
): Promise<GraphQLApi> => {
	// we need to remove open api extensions from the spec because they could be a first key in the spec
	// instead of params expected by omnigraph for the path
	const spec = removeExtensions(readSpec(oas, introspection.source));

	const headersBuilder = new HeadersBuilder();
	if (introspection.headers !== undefined) {
		introspection.headers(headersBuilder);
	}
	const headersConfiguration = headersBuilder.build();

	// we are collecting headers names to supply them as operation headers to the omnigraph
	// to been able to pass them on the execution time
	// we need only headers names, because we will get values from the context populated by wundernode
	let operationHeaders: Record<string, string> = {};
	for (const { key } of headersConfiguration) {
		operationHeaders[key] = `{context.headers['${key.toLowerCase()}']}`;
	}

	const options: OpenApiOptions = {
		source: spec,
		name: introspection.apiNamespace || 'api',
		operationHeaders: operationHeaders,
	};

	// get json schema options describing each path in the spec
	const extraJSONSchemaOptions = await getJSONSchemaOptionsFromOpenAPIOptions(options.name, options);
	// build json schema from the json schema options with the directives attached to fields
	const graphQLSchema = await loadNonExecutableGraphQLSchemaFromJSONSchemas(options.name, {
		...options,
		...extraJSONSchemaOptions,
	});

	// as logic of translating api calls stored in the directives we need print schema with directives
	const schema = printSchemaWithDirectives(graphQLSchema);

	return introspectGraphql(
		{
			url: `${WgEnv.ServerUrl}-openapi`, // workaround to been able to identify openapi proxy
			baseUrl: introspection.baseURL || '',
			path: `/openapis/${apiID}`,
			apiNamespace: introspection.apiNamespace,
			internal: true,
			loadSchemaFromString: () => schema,
			headers: introspection.headers,
			customIntScalars: ['BigInt'],
		},
		{},
		true
	);
};

// removeExtensions - removes all fields that starts with 'x-' from the spec
const removeExtensions = (spec: OasOrSwagger): OasOrSwagger => {
	const specJson = JSON.stringify(spec);

	return JSON.parse(specJson, (key, value) => {
		if (key.startsWith('x-')) {
			// remove field
			return undefined;
		}
		return value;
	});
};

// readSpec - tries to read spec as json, if it fails, tries to read it as yaml
const readSpec = (spec: string, source: OpenAPIIntrospectionSource): OasOrSwagger => {
	if (source.kind === 'file') {
		switch (path.extname(source.filePath)) {
			case '.yaml':
			case '.yml':
				const obj = yaml.load(spec);
				if (obj) {
					return obj as any;
				}
				throw new Error('cannot read OAS');
			case '.json':
				return JSON.parse(spec);
			default:
				return tryReadSpec(spec);
		}
	}

	return tryReadSpec(spec);
};

const tryReadSpec = (spec: string): OasOrSwagger => {
	try {
		return JSON.parse(spec);
	} catch (e) {
		const obj = yaml.load(spec);
		if (obj) {
			return obj as any;
		}
		throw new Error('cannot read OAS: ${e}');
	}
};
