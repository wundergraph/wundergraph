import { GraphQLApi, introspect, OpenAPIIntrospection, OpenAPIIntrospectionSource } from '../definition';
import yaml from 'js-yaml';
import path from 'path';
import { GraphQLSchema, printSchema } from 'graphql';
import { createGraphQLSchema, Oas3, Oas2 } from 'openapi-to-graphql';
import process from 'node:process';
import fs from 'fs';
import objectHash from 'object-hash';
import { InputVariable, mapInputVariable, resolveConfigurationVariable } from '../configure/variables';
import { pino } from 'pino';

const token = 'sk_test_123';
export const openApiSpecsLocation = path.join('generated', 'openapi');

type OasSpec = Oas3 | Oas2 | (Oas3 | Oas2);

interface ReadSpecResult {
	spec: OasSpec;
	extension: string;
}

interface OpenApiSpec {
	content: OasSpec;
	baseURL: InputVariable;
}

export const openApiSpecificationToGraphQLApi = async (
	oas: string,
	introspection: OpenAPIIntrospection
): Promise<GraphQLApi> => {
	if (!introspection.baseURL) {
		throw new Error('Base URL is not defined');
	}

	const readSpecResult = readSpec(oas, introspection.source);
	const apiGeneratedKey = objectHash(oas);

	writeSpec(apiGeneratedKey, readSpecResult.spec, introspection);

	const { schema } = await createGraphQLSchema(readSpecResult.spec, {
		fillEmptyResponses: true,
		viewer: false,
	});

	return introspect.graphql({
		url: '',
		baseUrl: '<SERVER_URL>',
		path: `/openapis/${apiGeneratedKey}/graphql`,
		apiNamespace: introspection.apiNamespace,
		internal: true,
		loadSchemaFromString: () => printSchema(schema),
		headers: introspection.headers,
	});
};

export const createExecutableSchema = async (specName: string, logger: pino.Logger): Promise<GraphQLSchema> => {
	const fullSpecPath = path.join(process.env.WG_DIR_ABS!, openApiSpecsLocation, specName);
	const specContent = fs.readFileSync(fullSpecPath).toString();
	const spec: OpenApiSpec = JSON.parse(specContent);

	const baseUrl = resolveConfigurationVariable(mapInputVariable(spec.baseURL));

	const { schema } = await createGraphQLSchema(spec.content, {
		fillEmptyResponses: true,
		baseUrl: baseUrl,
		viewer: false,
		headers: function (method, path, title, resolverParams) {
			logger.info(`method ${method}`);
			logger.info(`path  ${path}`);
			logger.info(`title ${title}`);
			logger.info(`resolverParams ${JSON.stringify(resolverParams?.context)}`);

			return {
				authorization: `Bearer ${token}`, // send authorization header in every request
			};
		},
	});

	return new Promise((resolve) => resolve(schema));
};

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

const writeSpec = (name: string, spec: OasSpec, introspection: OpenAPIIntrospection) => {
	const specsFolderPath = path.join(process.env.WG_DIR_ABS!, openApiSpecsLocation);
	fs.mkdir(specsFolderPath, { recursive: true }, (err) => {
		if (err) throw err;
	});

	const fileName = `${name}.json`;
	const filePath = path.join(specsFolderPath, fileName);

	const item: OpenApiSpec = {
		content: spec,
		baseURL: introspection.baseURL!,
	};

	fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
};

const readSpec = (spec: string, source: OpenAPIIntrospectionSource): ReadSpecResult => {
	if (source.kind === 'file') {
		switch (path.extname(source.filePath)) {
			case '.yaml':
			case '.yml':
				const obj = yaml.load(spec) as OasSpec;
				if (obj) {
					return {
						spec: obj,
						extension: 'yaml',
					};
				}
				throw new Error('cannot read OAS');
			case '.json':
				return {
					spec: JSON.parse(spec),
					extension: 'json',
				};
			default:
				return tryReadSpec(spec);
		}
	}

	return tryReadSpec(spec);
};

const tryReadSpec = (spec: string): ReadSpecResult => {
	try {
		return {
			spec: JSON.parse(spec),
			extension: 'json',
		};
	} catch (e) {
		const obj = yaml.load(spec) as OasSpec;
		if (obj) {
			return {
				spec: obj,
				extension: 'yaml',
			};
		}
		throw new Error('cannot read OAS');
	}
};
