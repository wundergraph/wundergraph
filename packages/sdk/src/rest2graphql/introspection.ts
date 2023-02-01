import { GraphQLApi, introspect, OpenAPIIntrospection, OpenAPIIntrospectionSource } from '../definition';
import path from 'path';
import yaml from 'js-yaml';
import process from 'node:process';
import fs from 'fs';
import objectHash from 'object-hash';
import { writeApiInfo } from './execution';
import { createGraphQLSchema, Oas2, Oas3 } from 'openapi-to-graphql';
import { printSchema } from 'graphql/index';

export type OasSpec = Oas3 | Oas2 | (Oas3 | Oas2);

export const openApiSpecificationToGraphQLApi = async (
	oas: string,
	introspection: OpenAPIIntrospection
): Promise<GraphQLApi> => {
	const spec = readSpec(oas, introspection.source);
	let apiID: string;

	if (introspection.id) {
		if (!introspection.id.match(/^[_\-0-9a-zA-z]+$/)) {
			throw new Error('Invalid characters in api id - please use only alphanumeric characters, dashes and underscores');
		}
		apiID = introspection.id;
	} else {
		apiID = objectHash(oas);
	}

	// TODO: in case apiID is changed the old one file still will exists. what could be a better place to cache the file?
	writeApiInfo(apiID, spec, introspection);

	const { schema } = await createGraphQLSchema(spec, {
		fillEmptyResponses: true,
		viewer: false,
	});

	return introspect.graphql({
		url: '',
		baseUrl: '<SERVER_URL>',
		path: `/openapis/${apiID}/graphql`,
		apiNamespace: introspection.apiNamespace,
		internal: true,
		loadSchemaFromString: () => printSchema(schema),
		headers: introspection.headers,
	});
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

const readSpec = (spec: string, source: OpenAPIIntrospectionSource): OasSpec => {
	if (source.kind === 'file') {
		switch (path.extname(source.filePath)) {
			case '.yaml':
			case '.yml':
				const obj = yaml.load(spec) as OasSpec;
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

const tryReadSpec = (spec: string): OasSpec => {
	try {
		return JSON.parse(spec);
	} catch (e) {
		const obj = yaml.load(spec) as OasSpec;
		if (obj) {
			return obj;
		}
		throw new Error('cannot read OAS');
	}
};
