import { Setup } from '../../setup/generate';
import { createGraphQLTestServers } from './servers';

export default async function () {
	const servers = createGraphQLTestServers();
	await Promise.all(servers.map((s) => s.start()));
	await Setup('apps/dynamic-router');
	await Promise.all(servers.map((s) => s.stop()));
}
