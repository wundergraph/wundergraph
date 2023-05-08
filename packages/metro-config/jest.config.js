module.exports = {
	testEnvironment: 'jsdom',
	testRegex: '/tests/.*\\.test\\.tsx?$',
	setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
	},
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
	coverageReporters: ['text', 'html'],
	reporters: ['default', 'github-actions'],
};
