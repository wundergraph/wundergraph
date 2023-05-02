import { GraphQLApi } from './index';
import { introspectWithCache } from './introspection-cache';
import { IHeadersBuilder } from './headers-builder';
import { soapToGraphQLApi } from '../introspection/soap';
import { readFile } from './openapi-introspection';

export interface SoapIntrospectionFile {
	kind: 'file';
	filePath: string;
}

export type SoapIntrospectionSource = SoapIntrospectionFile;

export interface SoapIntrospection {
	id: string;
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
		async (introspection: SoapIntrospection): Promise<GraphQLApi> => {
			return await soapToGraphQLApi(spec, introspection);
		}
	);
};
