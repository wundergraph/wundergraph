module.exports = {
	roots: ['<rootDir>/test/'],
	setupFiles: ['dotenv/config'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	testRegex: '(/__tests__/.*|\\.(test|spec))\\.[tj]sx?$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
