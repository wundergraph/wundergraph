import path from 'path';
import { WunderGraphConfigApplicationConfig } from '../configure';

export interface DotGraphQLConfigOptions {
	baseURL: string;
	nested: boolean;
}

export const generateDotGraphQLConfig = (
	wunderGraphConfig: WunderGraphConfigApplicationConfig,
	options: DotGraphQLConfigOptions
): Config => {
	let config: Config = {
		project: {
			schemaPath: path.join(options.nested ? '.wundergraph' : '', 'generated', `wundergraph.schema.graphql`),
			extensions: {
				endpoint: {
					introspect: false,
					url: `${options.baseURL}/graphql`,
					headers: {
						'user-agent': 'WunderGraph Client',
					},
				},
			},
		},
	};

	return config;
};

interface Config {
	project: Project;
}

interface Project {
	schemaPath: string;
	extensions: Extensions;
}

interface Extensions {
	endpoint: Endpoint;
}

interface Endpoint {
	url: string;
	headers: Headers;
	introspect: boolean;
}

interface Headers {
	[key: string]: string;
}
