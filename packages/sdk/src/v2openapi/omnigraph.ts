import { GraphQLApi, OpenAPIIntrospection, OpenAPIIntrospectionSource } from '../definition';
import path from 'path';
import yaml from 'js-yaml';
import { convertOpenApiV3 } from './index';
import { introspectGraphql } from '../definition/graphql-introspection';
import { HeadersBuilder } from '../definition/headers-builder';
import { WgEnv } from '../configure/options';
import { z as zod } from 'zod';
import { OpenAPIV3 } from 'openapi-types';
import { getJSONSchemaOptionsFromOpenAPIOptions, processDirectives } from '@omnigraph/openapi';
import { loadNonExecutableGraphQLSchemaFromJSONSchemas } from '@omnigraph/json-schema';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { buildSchema, GraphQLSchema } from 'graphql';
import { fetch } from '@whatwg-node/fetch';
import { PubSub } from '@graphql-mesh/utils';
import { LazyLoggerMessage, MeshPubSub } from '@graphql-mesh/types';
import { pino } from 'pino';

const apiIDRegexp = /^[_\-0-9a-z]+$/;
const apiIDSchema = zod
	.string({
		required_error: 'id is required',
		invalid_type_error: 'id must be a string',
	})
	.regex(apiIDRegexp, {
		message: 'id must contain only lowercase letters, numbers, dashes and underscores',
	})
	.min(2, {
		message: 'id must be at least 2 characters long',
	})
	.max(20, {
		message: 'id must be at most 20 characters long',
	});

export interface Options {
	source: OpenAPIV3.Document;
	endpoint?: string;
	name: string;
	operationHeaders: Record<string, string>;
}

export const openApiSpecificationToGraphQLApi = async (
	oas: string,
	introspection: OpenAPIIntrospection
): Promise<GraphQLApi> => {
	const validationResult = await apiIDSchema.safeParseAsync(introspection.id);
	if (!validationResult.success) {
		const err = validationResult.error.format()._errors.join(', ');
		throw new Error(`invalid id: ${err}`);
	}

	const apiID: string = validationResult.data;
	const specObj = readSpec(oas, introspection.source);
	const spec = await convertOpenApiV3(specObj);

	const headersBuilder = new HeadersBuilder();
	if (introspection.headers !== undefined) {
		introspection.headers(headersBuilder);
	}

	const headersConfiguration = headersBuilder.build();

	let operationHeaders: Record<string, string> = {};

	for (const { key } of headersConfiguration) {
		operationHeaders[key] = `{context.headers['${key}']}`;
	}

	const options: Options = {
		source: spec,
		endpoint: 'dummy-url',
		name: introspection.apiNamespace || 'api',
		operationHeaders: operationHeaders,
	};

	const extraJSONSchemaOptions = await getJSONSchemaOptionsFromOpenAPIOptions(options.name, options);
	const graphQLSchema = await loadNonExecutableGraphQLSchemaFromJSONSchemas(options.name, {
		...options,
		...extraJSONSchemaOptions,
	});

	const schema = printSchemaWithDirectives(graphQLSchema);

	return introspectGraphql({
		url: WgEnv.ServerUrl,
		baseUrl: introspection.baseURL || '',
		path: `/openapis/${apiID}`,
		apiNamespace: introspection.apiNamespace,
		internal: true,
		loadSchemaFromString: () => schema,
		headers: introspection.headers,
	});
};

const readSpec = (spec: string, source: OpenAPIIntrospectionSource): Object => {
	if (source.kind === 'file') {
		switch (path.extname(source.filePath)) {
			case '.yaml':
			case '.yml':
				const obj = yaml.load(spec);
				if (obj) {
					return obj;
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

const tryReadSpec = (spec: string): Object => {
	try {
		return JSON.parse(spec);
	} catch (e) {
		const obj = yaml.load(spec);
		if (obj) {
			return obj;
		}
		throw new Error('cannot read OAS: ${e}');
	}
};

export const executableSchema = (
	schemaStr: string,
	logger: pino.Logger,
	baseURL: string | undefined
): GraphQLSchema => {
	const schema = buildSchema(schemaStr);
	const pubsub = new PubSub() as MeshPubSub;

	const logWrapper = new LoggerWrapper(logger);

	return processDirectives({
		schema,
		logger: logWrapper,
		pubsub,
		globalFetch: fetch,
		endpoint: baseURL != '' ? baseURL : undefined,
	});
};

class LoggerWrapper {
	constructor(private logger: pino.Logger) {
		this.logger = logger;
	}

	public log(...args: any[]) {
		console.log(args);
		this.logger.info(args);
	}
	public warn(...args: any[]) {
		console.log(args);
		this.logger.warn(args);
	}
	public info(...args: any[]) {
		console.log(args);
		this.logger.info(args);
	}
	public error(...args: any[]) {
		console.log(args);
		this.logger.error(args);
	}
	public debug(...lazyArgs: LazyLoggerMessage[]) {
		console.log(lazyArgs);
	}
	public child(name: string) {
		console.log('child: ', name);
		return this;
	}
}
