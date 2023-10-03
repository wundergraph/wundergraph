import path from 'path';
import { format } from 'util';
import process from 'node:process';
import fs from 'fs/promises';

import type { Logger as GraphQLMeshLogger } from '@graphql-mesh/types';
import { Logger as PinoLogger } from 'pino';

import {
	ApiIntrospectionOptions,
	GraphQLApi,
	HTTPUpstream,
	IntrospectionFetchOptions,
	IntrospectionHeadersOptions,
	ReplaceCustomScalarTypeFieldConfiguration,
	RESTApi,
} from './index';
import { openApiSpecificationToRESTApiObject } from '../v2openapi';
import { introspectWithCache } from './introspection-cache';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import yaml from 'js-yaml';
import { HeadersBuilder, mapHeaders, resolveIntrospectionHeaders } from './headers-builder';
import { getJSONSchemaOptionsFromOpenAPIOptions } from '@omnigraph/openapi';
import { loadNonExecutableGraphQLSchemaFromJSONSchemas } from '@omnigraph/json-schema';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { introspectGraphql } from './graphql-introspection';
import { WgEnv } from '../configure/options';
import { InputVariable, mapInputVariable, resolveVariable } from '../configure/variables';
import { validateNamespace } from './namespacing';

export interface OpenAPIIntrospectionFile {
	kind: 'file';
	filePath: string;
}

export interface OpenAPIIntrospectionString {
	kind: 'string';
	openAPISpec: string;
}

export interface OpenAPIIntrospectionObject {
	kind: 'object';
	openAPIObject: {};
}

export interface OpenAPIIntrospectionUrl {
	kind: 'url';
	url: InputVariable;
}

/*
 * OpenAPI introspection
 */

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

export type OpenAPIIntrospectionSource =
	| OpenAPIIntrospectionFile
	| OpenAPIIntrospectionString
	| OpenAPIIntrospectionObject;

export interface OpenAPIIntrospection extends HTTPUpstream {
	source: OpenAPIIntrospectionSource;
	// statusCodeUnions set to true will make all responses return a union type of all possible response objects,
	// mapped by status code
	// by default, only the status 200 response is mapped, which keeps the GraphQL API flat
	// by enabling statusCodeUnions, you have to unwrap the response union via fragments for each response
	statusCodeUnions?: boolean;
	baseURL?: InputVariable;
	// the schemaExtension field is used to extend the generated GraphQL schema with additional types and fields
	// this is useful for specifying type definitions for JSON objects
	schemaExtension?: string;
	replaceCustomScalarTypeFields?: ReplaceCustomScalarTypeFieldConfiguration[];
}

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

/*
 * OpenAPIV2 introspection
 */

export type OpenAPIIntrospectionV2Source =
	| OpenAPIIntrospectionFile
	| OpenAPIIntrospectionString
	| OpenAPIIntrospectionObject
	| OpenAPIIntrospectionUrl;

export interface OpenAPIIntrospectionV2
	extends Omit<HTTPUpstream, 'authentication' | 'mTLS' | 'requestTimeoutSeconds' | 'introspection'> {
	source: OpenAPIIntrospectionV2Source;
	baseURL?: InputVariable;
	customJSONScalars?: string[];
	customIntScalars?: string[];
	customFloatScalars?: string[];
	// the schemaExtension field is used to extend the generated GraphQL schema with additional types and fields
	// this is useful for specifying type definitions for JSON objects
	schemaExtension?: string;
	replaceCustomScalarTypeFields?: ReplaceCustomScalarTypeFieldConfiguration[];
	introspection?: IntrospectionFetchOptions & IntrospectionHeadersOptions;
}

/**
 * Implements a GraphQLMeshLogger compatible logger wrapping a Pino logger
 */
class OpenAPILogger implements GraphQLMeshLogger {
	constructor(private logger: PinoLogger) {}

	log(...args: any[]) {
		this.logger.info(format(...args));
	}

	debug(...args: any[]) {
		// When "healing" a schema, the OAS parser generates a child logger
		// with a name starts with "heal" and then issues debug messages to
		// it. Since these messages are a bit critical we want to raise their
		// level to warning.
		const name = this.logger.bindings()['name'];
		if (name && name.startsWith('heal')) {
			this.warn(...args);
			return;
		}
		this.logger.debug(format(...args));
	}

	info(...args: any[]) {
		this.logger.info(format(...args));
	}

	warn(...args: any[]) {
		this.logger.warn(format(...args));
	}

	error(...args: any[]) {
		this.logger.error(format(...args));
	}

	child(name: string) {
		return new OpenAPILogger(this.logger.child({ name }));
	}
}

export const introspectOpenApiV2 = async (introspection: OpenAPIIntrospectionV2) => {
	const specSource = getSource(introspection.source);
	const keyInput = JSON.stringify(specSource);
	const configuration = { keyInput, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: OpenAPIIntrospectionV2, options: ApiIntrospectionOptions): Promise<GraphQLApi> => {
			return await openApiSpecificationToGraphQLApi(specSource, introspection, options.apiID!, options.logger);
		}
	);
};

type OasSource = string | OpenAPIV3.Document | OpenAPIV2.Document;

interface OpenApiOptions {
	source: OasSource;
	cwd: string;
	endpoint?: string;
	name: string;
	schemaHeaders: Record<string, string>;
	operationHeaders: Record<string, string>;
	logger?: GraphQLMeshLogger;
}

export const openApiSpecificationToGraphQLApi = async (
	source: OasSource, // could be json, file path or url
	introspection: OpenAPIIntrospectionV2,
	apiID: string,
	logger?: PinoLogger
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

	let introspectionHeaders: Record<string, string> = {};
	if (introspection.introspection?.headers) {
		const introspectionHeadersBuilder = new HeadersBuilder();
		introspection.introspection.headers(introspectionHeadersBuilder);
		introspectionHeaders = resolveIntrospectionHeaders(mapHeaders(introspectionHeadersBuilder));
	}

	if (introspection.apiNamespace) {
		validateNamespace(introspection.apiNamespace);
	}

	const openApiLogger = logger ? new OpenAPILogger(logger.child({ component: '@wundergraph/openapi' })) : undefined;

	const options: OpenApiOptions = {
		source,
		cwd: process.cwd(),
		name: introspection.apiNamespace || 'api',
		schemaHeaders: introspectionHeaders,
		operationHeaders,
		logger: openApiLogger,
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
			customJSONScalars: introspection.customJSONScalars,
			customIntScalars: introspection.customIntScalars,
			customFloatScalars: introspection.customFloatScalars,
			schemaExtension: introspection.schemaExtension,
			replaceCustomScalarTypeFields: introspection.replaceCustomScalarTypeFields,
		},
		{}
	);
};

const getSource = (source: OpenAPIIntrospectionV2Source): OasSource => {
	switch (source.kind) {
		case 'file':
			return source.filePath; // let omnigraph read spec
		case 'url':
			return resolveVariable(source.url); // let omnigraph download spec
		case 'object':
			return source.openAPIObject as any;
		case 'string':
			return tryReadSpec(source.openAPISpec);
		default:
			throw new Error('unknown OAS source');
	}
};

const tryReadSpec = (spec: string): OasSource => {
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
