module.exports = {
	roots: ['<rootDir>/test/'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	testRegex: '(/__tests__/.*|\\.(test|spec))\\.[tj]sx?$',
	testTimeout: 10 * 1000,
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
