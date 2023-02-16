import { GraphQLApi, OpenAPIIntrospection, OpenAPIIntrospectionSource } from '../definition';
import path from 'path';
import yaml from 'js-yaml';
import objectHash from 'object-hash';
import { openApiSpecsLocation } from './execution';
import { createGraphQLSchema, Oas2, Oas3 } from 'openapi-to-graphql';
import { printSchema } from 'graphql/index';
import { WgEnv } from '../configure/options';
import { introspectGraphql } from '../definition/graphql-introspection';
import process from 'node:process';
import { mkdir, readdir, rm, writeFile } from 'fs/promises';
import { InputVariable } from '../configure/variables';
import { HeadersBuilder } from '../definition/headers-builder';
import { existsSync } from 'fs';

export type OasSpec = Oas3 | Oas2 | (Oas3 | Oas2);

export interface OpenApiSpec {
	content: OasSpec;
	baseURL: InputVariable | undefined;
	headers: string[];
}

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

	await writeApiInfo(apiID, spec, introspection);

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
		throw new Error('cannot read OAS: ${e}');
	}
};

const forwardHeaders = (introspection: OpenAPIIntrospection): string[] => {
	const headersBuilder = new HeadersBuilder();

	if (introspection.headers !== undefined) {
		introspection.headers(headersBuilder);
	}

	return headersBuilder.build().map((value) => value.key.toLowerCase());
};

const specsAbsPath = () => path.join(process.env.WG_DIR_ABS || '', openApiSpecsLocation);

const writeApiInfo = async (name: string, spec: OasSpec, introspection: OpenAPIIntrospection) => {
	const specsFolderPath = specsAbsPath();
	await mkdir(specsFolderPath);

	const fileName = `${name}.json`;
	const filePath = path.join(specsFolderPath, fileName);

	const item: OpenApiSpec = {
		content: spec,
		baseURL: introspection.baseURL,
		headers: forwardHeaders(introspection),
	};

	await writeFile(filePath, JSON.stringify(item, null, 2), { encoding: 'utf-8' });
};

export const cleanOpenApiSpecs = async () => {
	if (!openApisExists()) {
		return;
	}

	const specsFolderPath = specsAbsPath();
	await rm(specsFolderPath, { recursive: true, force: true });
};

export const openApisExists = (): boolean => {
	const specsFolderPath = specsAbsPath();
	return existsSync(specsFolderPath);
};

export const listOpenApiSpecs = async (): Promise<string[]> => {
	const specsFolderPath = specsAbsPath();
	return readdir(specsFolderPath);
};
