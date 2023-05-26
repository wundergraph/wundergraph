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
	const specSource = getSource(introspection.source);
	const configuration = { keyInput: specSource, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: OpenAPIIntrospectionV2, options: ApiIntrospectionOptions): Promise<GraphQLApi> => {
			return await openApiSpecificationToGraphQLApi(specSource, introspection, options.apiID!);
		}
	);
};

interface OpenApiOptions {
	source: string;
	cwd: string;
	endpoint?: string;
	name: string;
	operationHeaders: Record<string, string>;
}

export const openApiSpecificationToGraphQLApi = async (
	source: string, // could be json, file path or url
	introspection: OpenAPIIntrospectionV2,
	apiID: string
): Promise<GraphQLApi> => {
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
		source,
		cwd: process.cwd(),
		name: introspection.apiNamespace || 'api',
		operationHeaders,
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

const getSource = (source: OpenAPIIntrospectionSource): string => {
	switch (source.kind) {
		case 'file':
			return source.filePath; // let omnigraph handle reading spec
		case 'object':
			return JSON.stringify(source.openAPIObject);
		case 'string':
			return tryReadSpec(source.openAPISpec);
	}
};

const tryReadSpec = (spec: string): string => {
	try {
		return JSON.stringify(JSON.parse(spec));
	} catch (e) {
		const obj = yaml.load(spec);
		if (obj) {
			return JSON.stringify(obj);
		}
		throw new Error('cannot read OAS: ${e}');
	}
};
