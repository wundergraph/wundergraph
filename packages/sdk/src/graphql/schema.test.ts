import { cleanupSchema } from './schema';
import { buildSchema } from 'graphql';

describe('cleanupSchema', () => {
	describe('renamed query types', function () {
		const schemaSDL = `
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
			`;

		it('should rename query type', function () {
			const schema = buildSchema(schemaSDL);
			const resultSchema = cleanupSchema(schema);
			expect(resultSchema).toMatchSnapshot();
		});
	});
});
