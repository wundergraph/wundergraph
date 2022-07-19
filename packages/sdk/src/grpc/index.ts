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
		throw new Error('cannot read Grpc Protoset');
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

const schemaString = ``;
