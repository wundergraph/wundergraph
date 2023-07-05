import { createServer, YogaNodeServerInstance } from '@graphql-yoga/node';

// You can run locally with npx ts-node apps/schema-extensions/graphql-server.ts
const typeDefs = /* GraphQL */ `
	scalar HumanJSON

	scalar HairStyle

	interface Human {
		details: HumanJSON!
	}

	scalar Attributes
	scalar TrainerJSON

	interface Trainer {
		teamData: TrainerJSON!
	}

	type GymLeader implements Human & Trainer {
		id: ID!
		badgeNumber: Int!
		details: HumanJSON!
		teamData: TrainerJSON!
	}

	type Friend implements Human {
		id: ID!
		details: HumanJSON!
		hair: HairStyle!
	}

	type Rival implements Human & Trainer {
		id: ID!
		starter: String!
		details: HumanJSON!
		teamData: TrainerJSON!
		attributes: Attributes
	}

	union Character = Friend | Rival | GymLeader

	input FriendInput {
		id: ID!
		details: HumanJSON!
		hair: HairStyle
	}

	type Query {
		gymleader: GymLeader!
		characters: [Character!]!
		character(id: ID!): Character!
	}

	type Mutation {
		createFriend(input: FriendInput!): Friend!
	}
`;

const brock = {
	id: 1,
	badgeNumber: 1,
	details: `{
				"name": "Brock",
				"age": 15,
			}`,
	teamData: `{
				"highestLevel": 12,
				"typeSpeciality": "rock",
			}`,
};

const gary = {
	id: 2,
	starter: 'water',
	details: `{
				"name": "Gary",
				"age": 10,
			}`,
	teamData: `{
				"highestLevel": 65,
				"typeSpeciality": "N/A",
			}`,
	attributes: `{"skills": "high"}`,
};

const oak = {
	id: 3,
	details: `{
				"name": "Professor Oak",
				"age": 50,
			}`,
	hair: `{"short": true}`,
};

const resolvers = {
	Query: {
		gymleader: () => brock,
		characters: () => [brock, gary, oak],
		character: (obj: any, args: any) => {
			switch (args.id) {
				case '1':
					return brock;
				case '2':
					return gary;
				default:
					return oak;
			}
		},
	},
	Mutation: {
		createFriend: (obj: any, args: any) => {
			return {
				id: args.input.id,
				details: args.input.details,
				hair: { short: true },
			};
		},
	},
	Character: {
		__resolveType(obj: any, context: any, info: any) {
			if (obj.badgeNumber) {
				return 'GymLeader';
			}

			if (obj.starter) {
				return 'Rival';
			}

			if (obj.details) {
				return 'Friend';
			}

			return null;
		},
	},
	Human: {
		__resolveType(obj: any, context: any, info: any) {
			if (obj.badgeNumber) {
				return 'GymLeader';
			}

			if (obj.starter) {
				return 'Rival';
			}

			if (obj.details) {
				return 'Friend';
			}

			return null;
		},
	},
	Trainer: {
		__resolveType(obj: any, context: any, info: any) {
			if (obj.badgeNumber) {
				return 'GymLeader';
			}

			if (obj.starter) {
				return 'Rival';
			}

			return null;
		},
	},
};

export const createSchemaExtensionsTestServer = (port = 4000): YogaNodeServerInstance<any, any, any> => {
	return createServer({
		port,
		schema: {
			typeDefs,
			resolvers,
		},
	});
};

if (require.main === module) {
	const port = 4000;
	const server = createSchemaExtensionsTestServer(port);
	server.start().then(() => console.log(`Yoga GraphQL server started on port ${port}.`));
}
