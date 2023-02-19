module.exports = {
	testEnvironment: 'jsdom',
	testRegex: '/tests/.*\\.test\\.ts?$',
	setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
		'^.+\\.svelte$': 'svelte-jester',
	},
	transformIgnorePatterns: [
		'<rootDir>/node_modules/.pnpm/@tanstack+svelte-query@4.24.9_svelte@3.55.1/node_modules/@tanstack/svelte-query/',
	],
	moduleFileExtensions: ['js', 'ts', 'svelte'],
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
	coverageReporters: ['text', 'html'],
	reporters: ['default', 'github-actions'],
};
