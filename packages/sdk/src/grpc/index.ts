import { GrpcApi } from '../definition';
import { ConfigurationVariableKind, DataSourceKind } from '@wundergraph/protobuf';
import {
	applyNamespaceToExistingRootFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
} from '../definition/namespacing';
import { parse, buildASTSchema } from 'graphql';

export const protosetToGrpcApiObject = async (protoset: Buffer): Promise<GrpcApi> => {
	try {
		return mockGrpcApiObject(protoset);
	} catch (e) {
		throw new Error('cannot read Grpc Protoset:' + e);
	}
};

const mockGrpcApiObject = (protoset: Buffer): GrpcApi => {
	const apiNamespace = 'grpc';

	const ast = parse(schemaString);
	const astSchema = buildASTSchema(ast);

	let dataSources = [
		{
			Kind: DataSourceKind.GRPC,
			RootNodes: [
				{
					typeName: 'Query',
					fieldNames: ['starwars_StarwarsService_GetHero'],
				},
			],
			ChildNodes: [],
			Custom: {
				server: {
					protoset: protoset,
					target: {
						kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
						staticVariableContent: `'127.0.0.1:9090'`,
						environmentVariableName: '',
						environmentVariableDefaultValue: '',
						placeholderVariableName: '',
					},
				},
				endpoint: {
					package: 'starwars',
					service: 'StarwarsService',
					method: 'GetHero',
				},
				request: {
					header: {},
					body: '{{ .arguments.input }}',
				},
			},
			Directives: [],
		},
	];

	let fields = [
		{
			typeName: 'Query',
			fieldName: 'starwars_StarwarsService_GetHero',
			disableDefaultFieldMapping: true,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
	];

	return new GrpcApi(
		applyNameSpaceToGraphQLSchema(schemaString, [], apiNamespace),
		dataSources,
		applyNamespaceToExistingRootFieldConfigurations(fields, astSchema, apiNamespace),
		[],
		[]
	);
};

const schemaString = `
type Query {
  starwars_StarwarsService_GetHero(input: starwars_GetHeroRequest_Input): starwars_Character
  starwars_StarwarsService_GetHuman(input: starwars_GetHumanRequest_Input): starwars_Character
  starwars_StarwarsService_GetDroid(input: starwars_GetDroidRequest_Input): starwars_Character
  starwars_StarwarsService_ListHumans(input: starwars_ListEmptyRequest_Input): starwars_ListHumansResponse
  starwars_StarwarsService_ListDroids(input: starwars_ListEmptyRequest_Input): starwars_ListDroidsResponse
  starwars_StarwarsService_connectivityState(tryToConnect: Boolean): ConnectivityState
}

type starwars_Character {
  id: String
  name: String
  friends: [starwars_Character]
  appears_in: [starwars_Episode]
  home_planet: String
  primary_function: String
  type: starwars_Type
}

enum starwars_Episode {
  _
  NEWHOPE
  EMPIRE
  JEDI
}

enum starwars_Type {
  HUMAN
  DROID
}

input starwars_GetHeroRequest_Input {
  episode: starwars_Episode
}

input starwars_GetHumanRequest_Input {
  id: String
}

input starwars_GetDroidRequest_Input {
  id: String
}

type starwars_ListHumansResponse {
  humans: [starwars_Character]
}

scalar starwars_ListEmptyRequest_Input @specifiedBy(url: "http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf")

type starwars_ListDroidsResponse {
  droids: [starwars_Character]
}

enum ConnectivityState {
  IDLE
  CONNECTING
  READY
  TRANSIENT_FAILURE
  SHUTDOWN
}`;
