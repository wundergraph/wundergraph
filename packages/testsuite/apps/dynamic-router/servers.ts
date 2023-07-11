import { createServer, YogaNodeServerInstance } from '@graphql-yoga/node';

const typeDefs = /* GraphQL */ `
	type Query {
		hello: [String!]!
	}
`;

const createResolvers = (name: string) => {
	return {
		Query: {
			hello: () => [`hello I'm ${name}`],
		},
	};
};

export const createGraphQLTestServer = (name: string, port: number): YogaNodeServerInstance<any, any, any> => {
	return createServer({
		port,
		schema: {
			typeDefs,
			resolvers: createResolvers(name),
		},
	});
};

export const createGraphQLTestServers = () => {
	const s1 = createGraphQLTestServer('1', 6001);
	const s2 = createGraphQLTestServer('2', 6002);
	const s3 = createGraphQLTestServer('3', 6003);

	return [s1, s2, s3];
};

if (require.main === module) {
	const servers = createGraphQLTestServers();
	Promise.all(servers.map((s) => s.start())).then(() => console.log(`GraphQL servers started`));
}
