import { GraphQLIntrospection } from '../definition';
import { cleanupSchema } from './schema';
import { buildSchema } from 'graphql';

interface TestCase {
	schema: string;
	introspection: GraphQLIntrospection;
}

const runTest = (testCase: TestCase, snapshotName: string) => {
	const schema = buildSchema(testCase.schema);
	const resultSchema = cleanupSchema(schema, testCase.introspection);
	expect(resultSchema).toMatchSnapshot();
};

describe('cleanupSchema', () => {
	describe('renamed query types', function () {
		const testCase = {
			schema: `
				schema {
					query: QueryType
					mutation: MutationType
					subscription: SubscriptionType
				}
				type QueryType {
					foo: String
				}
				type MutationType {
					foo: String
				}
				type SubscriptionType {
					foo: String
				}
				type Foo {
					queryViewer: QueryType
					mutationViewer: MutationType
					subscriptionViewer: SubscriptionType
				}
			`,
			introspection: {
				url: 'http://dummy',
			},
		};

		it('should rename query type', function () {
			runTest(testCase, 'renamed query type');
		});
	});

	describe('custom Int/Float scalars', function () {
		it('should replace int scalar', function () {
			const testCase = {
				schema: `
					scalar CustomInt
					type Query {
						foo: CustomInt
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
});
