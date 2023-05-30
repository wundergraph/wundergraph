import { Setup } from '../../setup/generate';
import { createSchemaExtensionsTestServer } from './graphql-server';

export default async function () {
	const server = createSchemaExtensionsTestServer();
	await server.start();
	await Setup('apps/schema-extensions');
	await server.stop();
}
