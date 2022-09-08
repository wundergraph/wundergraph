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
		projects: {},
	};

	const app = wunderGraphConfig.application;
	const deployment = 'main';

	const url = new URL(`${app.name}/${deployment}/graphql`, options.baseURL).toString();

	config.projects[app.name] = {
		name: app.name,
		schemaPath: path.join(options.nested ? '.wundergraph' : '', 'generated', `wundergraph.${app.name}.schema.graphql`),
		extensions: {
			endpoints: {
				[app.name]: {
					introspect: false,
					url: url,
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
	projects: Projects;
}

interface Projects {
	[project: string]: Project;
}

interface Project {
	name: string;
	schemaPath: string;
	extensions: Extensions;
}

interface Extensions {
	endpoints: Endpoints;
}

interface Endpoints {
	[name: string]: Endpoint;
}

interface Endpoint {
	url: string;
	headers: Headers;
	introspect: boolean;
}

interface Headers {
	[key: string]: string;
}
