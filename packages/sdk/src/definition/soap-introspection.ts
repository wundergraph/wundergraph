import { ApiIntrospectionOptions, GraphQLApi } from './index';
import { introspectWithCache } from './introspection-cache';
import { IHeadersBuilder } from './headers-builder';
import { readFile } from './openapi-introspection';
import { SOAPLoader } from '@omnigraph/soap';
import { fetch } from '@whatwg-node/fetch';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { introspectGraphql } from './graphql-introspection';
import { WgEnv } from '../configure/options';

export interface SoapIntrospectionFile {
	kind: 'file';
	filePath: string;
}

export type SoapIntrospectionSource = SoapIntrospectionFile;

export interface SoapIntrospection {
	id?: string;
	apiNamespace?: string;
	headers?: (builder: IHeadersBuilder) => IHeadersBuilder;
	source: SoapIntrospectionSource;
}

export const introspectSoap = async (introspection: SoapIntrospection) => {
	const spec = await readFile(introspection.source.filePath);
	const configuration = { keyInput: spec, source: 'localFilesystem' };
	return introspectWithCache(
		introspection,
		configuration,
		async (introspection: SoapIntrospection, options: ApiIntrospectionOptions): Promise<GraphQLApi> => {
			return await soapToGraphQLApi(spec, introspection, options.apiID!);
		}
	);
};

const soapToGraphQLApi = async (wsdl: string, introspection: SoapIntrospection, apiID: string): Promise<GraphQLApi> => {
	const soapLoader = new SOAPLoader({
		fetch,
	});

	await soapLoader.loadWSDL(wsdl);
	const graphQLSchema = soapLoader.buildSchema();

	const schema = printSchemaWithDirectives(graphQLSchema);

	return introspectGraphql(
		{
			url: `${WgEnv.ServerUrl}-soap`,
			path: `/soap/${apiID}`,
			apiNamespace: introspection.apiNamespace,
			internal: true,
			loadSchemaFromString: () => schema,
			headers: introspection.headers,
			customIntScalars: ['BigInt'],
		},
		{}
	);
};
