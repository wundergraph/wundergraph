import { createServer, YogaNodeServerInstance } from '@graphql-yoga/node';

const typeDefs = /* GraphQL */ `
	type Person {
		name: String!
		age: Int!
	}
	type Team {
		id: String!
		people: [Person!]!
	}
	type Query {
		hello: [String!]!
		teams: [Team!]!
	}
`;

const createResolvers = (id: number) => {
	const names = ['Alice', 'Bob', 'Mallory'];
	const allTeams = [
		[{ id: 'sales', people: [{ name: 'John', age: 42 }] }],
		[
			{ id: 'sales', people: [{ name: 'James', age: 18 }] },
			{ id: 'engineering', people: [{ name: 'Patricia', age: 36 }] },
		],
		[{ id: 'engineering', people: [{ name: 'Sandra', age: 51 }] }],
	];
	const name = names[id] ?? id.toString();
	const teams = allTeams[id] ?? [];
	return {
		Query: {
			hello: () => [`hello I'm ${name}`],
			teams: () => teams,
		},
	};
};

export const createGraphQLTestServer = (id: number, port: number): YogaNodeServerInstance<any, any, any> => {
	return createServer({
		port,
		schema: {
			typeDefs,
			resolvers: createResolvers(id),
		},
	});
};

export const createGraphQLTestServers = () => {
	const s1 = createGraphQLTestServer(0, 6001);
	const s2 = createGraphQLTestServer(1, 6002);
	const s3 = createGraphQLTestServer(2, 6003);

	return [s1, s2, s3];
};

if (require.main === module) {
	const servers = createGraphQLTestServers();
	Promise.all(servers.map((s) => s.start())).then(() => console.log(`GraphQL servers started`));
}
