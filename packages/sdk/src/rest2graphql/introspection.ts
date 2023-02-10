import { GraphQLApi, OpenAPIIntrospection, OpenAPIIntrospectionSource } from '../definition';
import path from 'path';
import yaml from 'js-yaml';
import objectHash from 'object-hash';
import { writeApiInfo } from './execution';
import { createGraphQLSchema, Oas2, Oas3 } from 'openapi-to-graphql';
import { printSchema } from 'graphql/index';
import { WgEnv } from '../configure/options';
import { introspectGraphql } from '../definition/graphql-introspection';

export type OasSpec = Oas3 | Oas2 | (Oas3 | Oas2);

const apiIDRegexp = /^[_\-0-9a-z]+$/;

export const openApiSpecificationToGraphQLApi = async (
	oas: string,
	introspection: OpenAPIIntrospection
): Promise<GraphQLApi> => {
	const spec = readSpec(oas, introspection.source);
	let apiID: string;

	if (introspection.id) {
		if (!introspection.id.match(apiIDRegexp)) {
			throw new Error(
				'Invalid characters in api id - please use only lower case alphanumeric letters, dashes and underscores'
			);
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

	return introspectGraphql({
		url: '',
		baseUrl: WgEnv.ServerUrl,
		path: `/openapis/${apiID}/graphql`,
		apiNamespace: introspection.apiNamespace,
		internal: true,
		loadSchemaFromString: () => printSchema(schema),
		headers: introspection.headers,
	});
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
