import { Setup } from '../../setup/generate';
import execa from 'execa';
import { createSchemaExtensionsTestServer } from './graphql-server';

export default async function () {
	const server = createSchemaExtensionsTestServer();
	await server.start();
	await execa('apps/schema-extensions/test-setup.sh');
	await Setup('apps/schema-extensions');
	await server.stop();
	// Automatic teardown (Prisma client will complain that the DB has been terminated)
	return async () => {
		await execa('docker', ['compose', '-f', 'apps/schema-extensions/docker-compose.yml', 'down', '-v']);
	};
}
