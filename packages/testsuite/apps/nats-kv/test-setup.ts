import { Setup } from '../../setup/generate';

export default async function () {
	await Setup('apps/nats-kv', {
		env: {
			WG_DISABLE_EMBEDDED_NATS: 'false',
		},
	});
}
