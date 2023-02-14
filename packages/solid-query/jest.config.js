module.exports = {
	preset: 'solid-jest/preset/browser',
	setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
	transform: {
		'^.+\\.mjs?$': require.resolve('babel-jest'),
	},
	testRegex: '/tests/.*\\.test\\.tsx?$',
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
	coverageReporters: ['text', 'html'],
	reporters: ['default', 'github-actions'],
	transformIgnorePatterns: [],
};
