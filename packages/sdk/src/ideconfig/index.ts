import fs from 'fs';
import path from 'path';

const configFilename = '.graphqlrc';

export interface IDEConfigOptions {
	projectRootDir: string;
	/**
	 * Absolute path to .wundergraph directory
	 */
	wundergraphDir: string;
	/**
	 * Base node URL
	 */
	nodeUrl: string;
	generateGraphQLConfig: boolean;
	logger?: (msg: string) => void;
}

interface GraphQLIDEConfigOptions {
	/**
	 * Absolute path to directory to write the config file to
	 */
	dir: string;
	/**
	 * Absolute path to .wundergraph directory
	 */
	wundergraphDir: string;
	/**
	 * Base node URL
	 */
	nodeUrl: string;
}

export const generateIDEConfig = (options: IDEConfigOptions) => {
	if (options.generateGraphQLConfig) {
		const graphqlConfig = generateGraphQLIDEConfig({
			dir: options.projectRootDir,
			nodeUrl: options.nodeUrl,
			wundergraphDir: options.wundergraphDir,
		});

		let shouldUpdateIDEConfig = true;
		if (fs.existsSync(graphqlConfig.path)) {
			const existingIDEConfig = fs.readFileSync(graphqlConfig.path, { encoding: 'utf8' });
			shouldUpdateIDEConfig = existingIDEConfig !== graphqlConfig.data;
		}

		if (shouldUpdateIDEConfig) {
			fs.writeFileSync(graphqlConfig.path, graphqlConfig.data, { encoding: 'utf8' });
			if (options.logger) {
				options.logger(`generating GraphQL IDE config ${graphqlConfig.path}`);
			}
		}
	}
};

const generateGraphQLIDEConfig = (options: GraphQLIDEConfigOptions): GraphQLIDEConfigOutput => {
	let rel = path.relative(options.dir, options.wundergraphDir);
	if (!rel) {
		rel = '.';
	}
	// .grqphqlrc always uses slashes as directory separators
	const slashRel = rel.replace(/\\/g, '/');
	const schema = `${slashRel}/generated/wundergraph.schema.graphql`;
	const documents = `${slashRel}/operations/**/*.graphql`;
	const url = `${options.nodeUrl}/graphql`;
	const config = createGraphQLRC(schema, documents, url);
	return {
		path: path.join(options.dir, configFilename),
		data: JSON.stringify(config, null, '  '),
	};
};

interface GraphQLIDEConfigOutput {
	/** Path the file should be written to */
	path: string;
	/* File contents */
	data: string;
}

type GraphQLRC = {
	/**
	 * Relative path to schema
	 */
	schema: string;
	/**
	 * Relative path to .graphql documents (can contain wildcards)
	 */
	documents: string;
	extensions: {
		endpoint: {
			introspect: boolean;
			/** Endpoint URL */
			url: string;
			headers: {
				[key: string]: string;
			};
		};
	};
};

const createGraphQLRC = (schema: string, documents: string, url: string): GraphQLRC => {
	return {
		schema: schema,
		documents: documents,
		extensions: {
			endpoint: {
				introspect: false,
				url: url,
				headers: {
					'user-agent': 'WunderGraph Client',
				},
			},
		},
	};
};
