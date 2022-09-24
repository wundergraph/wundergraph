import path from 'path';
import { WunderGraphConfigApplicationConfig } from '../configure';

export interface DotGraphQLConfigOptions {
	baseURL: string;
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

	config.projects[app.name] = {
		name: app.name,
		schemaPath: path.join('.wundergraph', 'generated', `wundergraph.${app.name}.schema.graphql`),
		extensions: {
			endpoints: {
				[app.name]: {
					introspect: false,
					url: `${options.baseURL}/${app.name}/${deployment}/graphql`,
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
