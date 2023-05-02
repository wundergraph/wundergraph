import { GraphQLApi } from '../../definition';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { introspectGraphql } from '../../definition/graphql-introspection';
import { WgEnv } from '../../configure/options';
import { validateIntrospectionId } from '../../v2openapi/omnigraph';
import { SoapIntrospection } from '../../definition/soap-introspection';
import { SOAPLoader } from '@omnigraph/soap';
import { fetch } from '@whatwg-node/fetch';

export const soapToGraphQLApi = async (wsdl: string, introspection: SoapIntrospection): Promise<GraphQLApi> => {
	const apiID: string = await validateIntrospectionId(introspection.id);

	const soapLoader = new SOAPLoader({
		fetch,
	});

	await soapLoader.loadWSDL(wsdl);
	const graphQLSchema = soapLoader.buildSchema();

	const schema = printSchemaWithDirectives(graphQLSchema);

	return introspectGraphql(
		{
			url: `${WgEnv.ServerUrl}-soap`,
			// baseUrl: introspection.baseURL || '',
			path: `/soap/${apiID}`,
			apiNamespace: introspection.apiNamespace,
			internal: true,
			loadSchemaFromString: () => schema,
			headers: introspection.headers,
			customIntScalars: ['BigInt'],
		},
		{},
		true
	);
};
