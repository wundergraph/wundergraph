import { GraphQLApi, introspect, OpenAPIIntrospection, OpenAPIIntrospectionSource } from '../definition';
import yaml from 'js-yaml';
import path from 'path';
import { GraphQLSchema, printSchema } from 'graphql';
import { createGraphQLSchema, Oas3, Oas2 } from 'openapi-to-graphql';
import process from 'node:process';
import fs from 'fs';
import objectHash from 'object-hash';

const token = 'sk_test_123';

type OasSpec = Oas3 | Oas2 | (Oas3 | Oas2);

interface ReadSpecResult {
	spec: OasSpec;
	extension: string;
}

export const openApiSpecificationToGraphQLApi = async (
	oas: string,
	introspection: OpenAPIIntrospection
): Promise<GraphQLApi> => {
	const readSpecResult = readSpec(oas, introspection.source);
	const apiGeneratedKey = objectHash(introspection);

	const filePath = writeSpec(readSpecResult.spec, readSpecResult.extension, apiGeneratedKey);

	const { schema } = await createGraphQLSchema(readSpecResult.spec, {
		fillEmptyResponses: true,
		baseUrl: 'http://localhost:12111',
		viewer: false,
		headers: {
			authorization: `Bearer ${token}`, // send authorization header in every request
		},
	});

	return introspect.graphql(
		{
			url: '',
			baseUrl: '',
			path: `<SERVER_URL>/${apiGeneratedKey}`,
			apiNamespace: introspection.apiNamespace,
			internal: true,
			loadSchemaFromString: () => printSchema(schema),
		},
		{
			OasSpecPath: filePath,
		}
	);
};

export const createExecutableSchema = async (specPath: string): Promise<GraphQLSchema> => {
	const fullSpecPath = path.join(process.env.WG_DIR_ABS!, specPath);
	const introspection: OpenAPIIntrospectionSource = {
		kind: 'file',
		filePath: fullSpecPath,
	};
	const spec = loadOpenApi(introspection);
	const readSpecResult = readSpec(spec, introspection);

	const { schema } = await createGraphQLSchema(readSpecResult.spec, {
		fillEmptyResponses: true,
		baseUrl: 'http://localhost:12111',
		viewer: false,
		headers: {
			authorization: `Bearer ${token}`, // send authorization header in every request
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

const writeSpec = (spec: OasSpec, extension: string, name: string): string => {
	const relativePath = path.join('generated', 'openapi');
	const specsFolderPath = path.join(process.env.WG_DIR_ABS!, relativePath);
	fs.mkdir(specsFolderPath, { recursive: true }, (err) => {
		if (err) throw err;
	});

	const fileName = `${name}.${extension}`;
	const filePath = path.join(specsFolderPath, fileName);

	fs.writeFileSync(filePath, extension === 'yaml' ? yaml.dump(spec) : JSON.stringify(spec, null, 2));

	return path.join(relativePath, fileName);
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
