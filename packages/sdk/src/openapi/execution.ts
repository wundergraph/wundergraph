import { mapInputVariable, resolveConfigurationVariable } from '../configure/variables';
import path from 'path';
import process from 'node:process';
import { readFileSync } from 'fs';
import { createGraphQLSchema } from 'openapi-to-graphql';
import { ExecutionContext } from '../server/plugins/graphql';
import { OpenApiSpec } from './introspection';

export const openApiSpecsLocation = path.join('generated', 'openapi');

export const createExecutableSchema = async (specName: string) => {
	const fullSpecPath = path.join(process.env.WG_DIR_ABS!, openApiSpecsLocation, specName);
	const specContent = readFileSync(fullSpecPath).toString();
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

			return headers;
		},
	});

	return schema;
};
