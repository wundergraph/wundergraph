module.exports = {
	globals: {
		'ts-jest': {
			isolatedModules: true,
			diagnostics: {
				exclude: ['**'],
			},
		},
	},
	setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
	transform: {
		'^.+\\.mjs?$': require.resolve('babel-jest'),
		'^.+\\.(ts|tsx)$': 'ts-jest',
		'^.+\\.(ts|tsx)$': './transform.js',
	},
	testRegex: '/tests/.*\\.test\\.tsx?$',
	testEnvironment: 'jsdom',
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
	coverageReporters: ['text', 'html'],
	reporters: ['default', 'github-actions'],
	transformIgnorePatterns: [],
};
