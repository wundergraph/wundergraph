import { Setup } from '../../setup/generate';
import { createOpenApiSpecServer } from './openapi-spec-server';

export default async function () {
	const server = createOpenApiSpecServer(8091);
	await Setup('apps/openapi');
	await server.close();
}
