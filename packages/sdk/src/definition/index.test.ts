import { introspect } from './index';

const schema = `
schema {
	query: Query
}

type Query {
	user: User
}

interface User {
    id: ID!
    displayName: String!
    isLoggedIn: Boolean!
}

type RegisteredUser implements User {
    id: ID!
    displayName: String!
    isLoggedIn: Boolean!
	hasVerifiedEmail: Boolean!
}
`;

test('introspect GraphQL API with interface type definitions', async () => {
	const api = await introspect.graphql({
		apiNamespace: 'api',
		loadSchemaFromString: schema,
		url: 'http://localhost:8080/graphql',
	});
	expect(api).toMatchSnapshot();
});
