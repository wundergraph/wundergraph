import { GraphQLIntrospection } from '../definition';
import { describe } from 'node:test';
import { replaceCustomNumericScalars } from './replaceCustomNumericScalars';

interface TestCase {
	schema: string;
	introspection: GraphQLIntrospection;
}

const runTest = (testCase: TestCase, snapshotName: string) => {
	const result = replaceCustomNumericScalars(testCase.schema, testCase.introspection);
	expect(result).toMatchSnapshot(snapshotName);
};

describe('replaceCustomNumericScalars', () => {
	it('should replace int scalar', function () {
		const testCase = {
			schema: `
					scalar CustomInt
					type Query {
						foo: CustomInt
						bar(a: CustomInt): String
					}
				`,
			introspection: {
				url: 'http://dummy',
				customIntScalars: ['CustomInt'],
			},
		};

		runTest(testCase, 'custom int scalar');
	});

	it('should replace float scalar', function () {
		const testCase = {
			schema: `
					scalar CustomFloat
					type Query {
						foo: CustomFloat
						bar(a: CustomFloat): String
					}
					`,
			introspection: {
				url: 'http://dummy',
				customFloatScalars: ['CustomFloat'],
			},
		};

		runTest(testCase, 'custom float scalar');
	});
});
