import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	{
		root: 'apps/basic',
		test: {
			globalSetup: 'apps/basic/test-setup.ts',
		},
	},
	{
		root: 'apps/auth',
		test: {
			globalSetup: 'apps/auth/test-setup.ts',
		},
	},
	{
		root: 'apps/generation',
		test: {
			globalSetup: 'apps/generation/test-setup.ts',
			testTimeout: 30000,
			hookTimeout: 30000,
		},
	},
	{
		root: 'apps/hooks',
		test: {
			globalSetup: 'apps/hooks/test-setup.ts',
		},
	},
]);
