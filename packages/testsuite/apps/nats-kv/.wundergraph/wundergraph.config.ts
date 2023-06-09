import {
	configureWunderGraphApplication,
	introspect,
	templates,
	configureWunderGraphGeneration,
} from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';
import { z } from 'zod';

const kv = introspect.natsKV({
	apiNamespace: 'kv',
	model: z.object({
		token: z.string(),
	}),
});

configureWunderGraphApplication({
	apis: [kv],
	server,
	operations,
	options: {
		defaultRequestTimeoutSeconds: 2,
	},
	generate: configureWunderGraphGeneration({
		codeGenerators: [
			{
				templates: [...templates.typescript.all],
			},
		],
	}),
	experimental: {
		orm: true,
	},
});
