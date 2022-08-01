import { GrpcApi } from '../definition';
import {
	applyNamespaceToExistingRootFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
} from '../definition/namespacing';
import { printSchema } from 'graphql';
import GrpcSchemaBuilder from './builder';
import { InputVariable } from '../configure';

export const protosetToGrpcApiObject = async (
	protoset: Buffer,
	url: InputVariable,
	apiNamespace?: string
): Promise<GrpcApi> => {
	try {
		const builder = new GrpcSchemaBuilder(protoset, url);
		const schema = await builder.Schema();
		const schemaString = printSchema(schema);

		const { dataSources, fields } = builder.BuildDatasources();

		if (!apiNamespace) {
			return new GrpcApi(schemaString, dataSources, fields, [], []);
		}

		const dataSourcesNS = dataSources.map((ds) => ({
			...ds,
			RootNodes: applyNameSpaceToTypeFields(ds.RootNodes, schema, apiNamespace),
		}));

		return new GrpcApi(
			applyNameSpaceToGraphQLSchema(schemaString, [], apiNamespace),
			dataSourcesNS,
			applyNamespaceToExistingRootFieldConfigurations(fields, schema, apiNamespace),
			[],
			[]
		);
	} catch (e) {
		throw new Error('cannot read Grpc Protoset:' + e);
	}
};
