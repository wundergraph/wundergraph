import { defineConfig } from 'vitest/config';

export function DefineTestConfig(appName: string) {
	return defineConfig({
		test: {
			globalSetup: `apps/${appName}/test-setup.ts`,
		},
	});
}
