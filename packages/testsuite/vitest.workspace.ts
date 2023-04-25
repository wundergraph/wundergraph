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
		root: 'apps/http-proxy',
		test: {
			globalSetup: 'apps/http-proxy/test-setup.ts',
			testTimeout: 60000,
		},
	},
	{
		root: 'apps/mock',
		test: {
			globalSetup: 'apps/mock/test-setup.ts',
		},
	},
	{
		root: 'apps/hooks',
		test: {
			globalSetup: 'apps/hooks/test-setup.ts',
		},
	},
]);
