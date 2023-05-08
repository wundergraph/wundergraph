import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
	live: {
		enable: true,
		pollingIntervalSeconds: 1,
	},
	handler: async () => {
		const bio =
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl nec ultricies tincidunt, nunc nisl aliquam nisl, eget aliquam nunc';
		return {
			now: new Date().toISOString(),
			bio,
		};
	},
});
