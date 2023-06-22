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

	describe(`removes federation directives`, function () {
		const schemaSDL = `
				directive @key on FIELD_DEFINITION
				directive @extends on FIELD_DEFINITION
				directive @external on FIELD_DEFINITION
				directive @requires on FIELD_DEFINITION
				directive @provides on FIELD_DEFINITION
		
				schema {
					query: Query
				}
		
				type Query {
					foo: String @key @extends @external @requires @provides
				}
			`;

		it('should remove federation directives and directive definitions', function () {
			const schema = buildSchema(schemaSDL);
			const resultSchema = cleanupSchema(schema);
			expect(resultSchema).toMatchInlineSnapshot(`
			"schema {
			  query: Query
			}

			type Query {
			  foo: String
			}"
		`);
		});
	});

	describe(`removes omnigraph directives`, function () {
		const schemaSDL = `
				directive @enum on FIELD_DEFINITION
				directive @example on FIELD_DEFINITION
				directive @globalOptions on FIELD_DEFINITION
				directive @httpOperation on FIELD_DEFINITION
				directive @regexp on FIELD_DEFINITION
				directive @resolveRoot on FIELD_DEFINITION
				directive @typescript on FIELD_DEFINITION
				directive @soap on FIELD_DEFINITION
		
				schema {
					query: Query
				}
		
				type Query {
					foo: String @enum @example @globalOptions @httpOperation @regexp @resolveRoot @typescript @soap
				}
			`;

		it('should remove omnigraph directives and directive definitions', function () {
			const schema = buildSchema(schemaSDL);
			const resultSchema = cleanupSchema(schema);
			expect(resultSchema).toMatchInlineSnapshot(`
			"schema {
			  query: Query
			}

			type Query {
			  foo: String
			}"
		`);
		});
	});
});
