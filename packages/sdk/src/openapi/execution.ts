import { InputVariable, mapInputVariable, resolveConfigurationVariable } from '../configure/variables';
import { GraphQLSchema } from 'graphql';
import path from 'path';
import process from 'node:process';
import fs from 'fs';
import { createGraphQLSchema } from 'openapi-to-graphql';
import { OpenAPIIntrospection } from '../definition';
import { OasSpec } from './introspection';
import { ExecutionContext } from '../server/plugins/graphql';
import { HeadersBuilder, mapHeaders } from '../definition/headers-builder';

export const openApiSpecsLocation = path.join('generated', 'openapi');

interface OpenApiSpec {
	content: OasSpec;
	baseURL: InputVariable | undefined;
	headers: string[];
}

export const createExecutableSchema = async (specName: string) => {
	const fullSpecPath = path.join(process.env.WG_DIR_ABS!, openApiSpecsLocation, specName);
	const specContent = fs.readFileSync(fullSpecPath).toString();
	const spec: OpenApiSpec = JSON.parse(specContent);

	let baseUrl: string | undefined;
	if (spec.baseURL) {
		baseUrl = resolveConfigurationVariable(mapInputVariable(spec.baseURL));
	}

	const { schema } = await createGraphQLSchema(spec.content, {
		fillEmptyResponses: true,
		baseUrl: baseUrl,
		viewer: false,
		headers: function (method, path, title, resolverParams) {
			const ctx = resolverParams?.context as ExecutionContext;

			const headers: Record<string, string> = {};

			spec.headers.reduce((acc, header: string) => {
				const value = ctx.wundergraph?.headers[header];
				if (value) {
					acc[header] = value;
				}
				return acc;
			}, headers);

			ctx.wundergraph?.log?.info(`created headers ${JSON.stringify(headers)}`);

			return headers;
		},
	});

	return schema;
};

export const writeApiInfo = (name: string, spec: OasSpec, introspection: OpenAPIIntrospection) => {
	const specsFolderPath = path.join(process.env.WG_DIR_ABS!, openApiSpecsLocation);
	fs.mkdir(specsFolderPath, { recursive: true }, (err) => {
		if (err) throw err;
	});

	const fileName = `${name}.json`;
	const filePath = path.join(specsFolderPath, fileName);

	const item: OpenApiSpec = {
		content: spec,
		baseURL: introspection.baseURL,
		headers: forwardHeaders(introspection),
	};

	fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
};

const forwardHeaders = (introspection: OpenAPIIntrospection): string[] => {
	const headersBuilder = new HeadersBuilder();

	if (introspection.headers !== undefined) {
		introspection.headers(headersBuilder);
	}

	return headersBuilder.build().map((value) => value.key.toLowerCase());
};
