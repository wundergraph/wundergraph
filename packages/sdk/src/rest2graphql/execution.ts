import { InputVariable, mapInputVariable, resolveConfigurationVariable } from '../configure/variables';
import { pino } from 'pino';
import { GraphQLSchema } from 'graphql';
import path from 'path';
import process from 'node:process';
import fs from 'fs';
import { createGraphQLSchema } from 'openapi-to-graphql';
import { OpenAPIIntrospection } from '../definition';
import { OasSpec } from './introspection';

export const openApiSpecsLocation = path.join('generated', 'openapi');

const token = 'sk_test_123';

interface OpenApiSpec {
	content: OasSpec;
	baseURL: InputVariable | undefined;
}

export const createExecutableSchema = async (specName: string, logger: pino.Logger): Promise<GraphQLSchema> => {
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
	};

	fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
};
