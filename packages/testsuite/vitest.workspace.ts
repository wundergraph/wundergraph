import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	{
		root: 'apps/basic',
		test: {
			globalSetup: 'apps/basic/test-setup.ts',
			testTimeout: 15000,
			hookTimeout: 20000,
		},
	},
	{
		root: 'apps/auth',
		test: {
			globalSetup: 'apps/auth/test-setup.ts',
			testTimeout: 15000,
			hookTimeout: 20000,
		},
	},
	{
		root: 'apps/hooks',
		test: {
			globalSetup: 'apps/hooks/test-setup.ts',
			testTimeout: 15000,
			hookTimeout: 20000,
		},
	},
	{
		root: 'apps/http-proxy',
		test: {
			globalSetup: 'apps/http-proxy/test-setup.ts',
			testTimeout: 15000,
			hookTimeout: 20000,
		},
	},
	{
		root: 'apps/mock',
		test: {
			globalSetup: 'apps/mock/test-setup.ts',
			testTimeout: 15000,
			hookTimeout: 20000,
		},
	},
	{
		root: 'apps/openapi',
		test: {
			globalSetup: 'apps/openapi/test-setup.ts',
			testTimeout: 15000,
			hookTimeout: 20000,
		},
	},
	{
		root: 'apps/experimental-flag',
		test: {
			globalSetup: 'apps/experimental-flag/test-setup.ts',
			testTimeout: 15000,
			hookTimeout: 20000,
		},
	},
]);
