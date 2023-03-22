import {
	buildMTLSConfiguration,
	buildUpstreamAuthentication,
	DataSource,
	OpenAPIIntrospection,
	RESTApi,
	RESTApiCustom,
} from '../definition';
import {
	buildASTSchema,
	GraphQLEnumType,
	GraphQLField,
	GraphQLInputObjectType,
	GraphQLInterfaceType,
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLUnionType,
	isEnumType,
	isInputObjectType,
	isInterfaceType,
	isObjectType,
	isScalarType,
	isUnionType,
	parse,
	printSchema,
} from 'graphql';
import {
	ConfigurationVariable,
	ConfigurationVariableKind,
	DataSourceKind,
	FieldConfiguration,
	HTTPHeader,
	HTTPMethod,
	URLQueryConfiguration,
} from '@wundergraph/protobuf';
import yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';
import {
	applyNamespaceToExistingRootFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
} from '../definition/namespacing';
import { HeadersBuilder, mapHeaders } from '../definition/headers-builder';
import { convertOpenApiV3 } from './index';
import {
	loadNonExecutableGraphQLSchemaFromJSONSchemas,
	HTTPMethod as OmnigraphHTTPMethod,
} from '@omnigraph/json-schema';
import { getJSONSchemaOptionsFromOpenAPIOptions } from '@omnigraph/openapi';
import { getDirectives, printSchemaWithDirectives } from '@graphql-tools/utils';
import fs from 'fs';
import { Options } from './jsonSchemaOptions';
import { mapInputVariable } from '../configure/variables';
import { HTTPRootFieldResolverOpts } from '@omnigraph/json-schema/typings/addRootFieldResolver';

export const openApiSpecificationToRESTApiObject = async (
	oas: string,
	introspection: OpenAPIIntrospection
): Promise<RESTApi> => {
	let spec: OpenAPIV3.Document;

	try {
		const specObject = JSON.parse(oas);
		spec = await convertOpenApiV3(specObject);
	} catch (e) {
		const obj = yaml.load(oas) as Object;
		if (!obj) {
			throw new Error('cannot read OAS');
		}
		spec = await convertOpenApiV3(obj);
	}

	const graphqlSchema = await prepareGraphqlSchema(spec, introspection);

	const builder = new RESTApiBuilder(introspection, graphqlSchema);
	return builder.build();
};

const prepareGraphqlSchema = async (
	spec: OpenAPIV3.Document,
	introspection: OpenAPIIntrospection
): Promise<GraphQLSchema> => {
	const options: Options = {
		source: spec,
		endpoint: 'dummy-url',
		name: introspection.apiNamespace || 'api',
	};

	const extraJSONSchemaOptions = await getJSONSchemaOptionsFromOpenAPIOptions(options.name, options);

	fs.writeFileSync('MESH_extraJSONSchemaOptions.json', JSON.stringify(extraJSONSchemaOptions, null, 2));

	const graphQLSchema = await loadNonExecutableGraphQLSchemaFromJSONSchemas(options.name, {
		...options,
		...extraJSONSchemaOptions,
	});

	// fs.writeFileSync('MESH_schema.graphql', printSchema(this.graphQLSchema));
	fs.writeFileSync('MESH_schema_directives.graphql', printSchemaWithDirectives(graphQLSchema));

	return graphQLSchema;
};

type DataSourceHeaders = { [key: string]: HTTPHeader };

class RESTApiBuilder {
	constructor(introspection: OpenAPIIntrospection, graphQLSchema: GraphQLSchema) {
		this.introspection = introspection;
		this.statusCodeUnions = introspection.statusCodeUnions || false;
		this.apiNamespace = introspection.apiNamespace;

		if (introspection.headers !== undefined) {
			this.headers = mapHeaders(introspection.headers(new HeadersBuilder()) as HeadersBuilder);
		}

		this.graphQLSchema = graphQLSchema;
	}

	private graphQLSchema: GraphQLSchema;

	private introspection: OpenAPIIntrospection;
	private apiNamespace?: string;
	private statusCodeUnions: boolean;

	private dataSources: DataSource<RESTApiCustom>[] = [];
	private headers: DataSourceHeaders = {};
	private fields: FieldConfiguration[] = [];
	private baseUrlArgs: string[] = [];

	public build = (): RESTApi => {
		this.processDirectives();

		const schemaString: string = printSchema(this.graphQLSchema);
		const schema = buildASTSchema(parse(schemaString));

		const dataSources = this.dataSources.map((ds) => {
			return {
				...ds,
				RootNodes: applyNameSpaceToTypeFields(ds.RootNodes, schema, this.apiNamespace),
				ChildNodes: applyNameSpaceToTypeFields(ds.ChildNodes, schema, this.apiNamespace),
			};
		});

		return new RESTApi(
			applyNameSpaceToGraphQLSchema(schemaString, [], this.apiNamespace),
			dataSources,
			applyNamespaceToExistingRootFieldConfigurations(this.fields, schema, this.apiNamespace),
			[],
			[]
		);
	};

	private addDataSource = (
		parentType: any,
		fieldName: string,
		verb: HTTPMethod,
		headers: DataSourceHeaders,
		path: ConfigurationVariable,
		baseUrl: ConfigurationVariable,
		body: ConfigurationVariable,
		query: URLQueryConfiguration[] = [],
		urlEncodeBody: boolean = false
	) => {
		const ds: DataSource<RESTApiCustom> = {
			RootNodes: [
				{
					typeName: parentType,
					fieldNames: [fieldName],
				},
			],
			Kind: DataSourceKind.REST,
			Custom: {
				Fetch: {
					method: verb,
					path: path,
					baseUrl: baseUrl,
					url: mapInputVariable(''),
					body: body,
					header: headers,
					query: query,
					mTLS: buildMTLSConfiguration(this.introspection),
					upstreamAuthentication: buildUpstreamAuthentication(this.introspection),
					urlEncodeBody: urlEncodeBody,
				},
				Subscription: {
					Enabled: false,
				},
				DefaultTypeName: this.statusCodeUnions ? 'UnspecifiedHttpResponse' : '',
				StatusCodeTypeMappings: [],
			},
			ChildNodes: [],
			Directives: [],
			RequestTimeoutSeconds: this.introspection.requestTimeoutSeconds ?? 0,
		};

		this.dataSources.push(ds);
	};

	private processDirectives = () => {
		const typeMap = this.graphQLSchema.getTypeMap();

		for (const typeName in typeMap) {
			const type = typeMap[typeName];

			if (isScalarType(type)) {
				this.processScalarType(type);
			}

			if (isInterfaceType(type)) {
				this.processInterfaceType(type);
			}

			if (isUnionType(type)) {
				this.processUnionType(type);
			}

			if (isEnumType(type)) {
				this.processEnumType(type);
			}

			if (isInputObjectType(type)) {
				this.processInputObjectType(type);
			}

			if (isObjectType(type)) {
				this.processObjectType(type);
			}
		}
	};

	private processScalarType = (type: GraphQLScalarType) => {};
	private processInterfaceType = (type: GraphQLInterfaceType) => {};
	private processUnionType = (type: GraphQLUnionType) => {};
	private processEnumType = (type: GraphQLEnumType) => {};
	private processInputObjectType = (type: GraphQLInputObjectType) => {};

	private processObjectType = (type: GraphQLObjectType) => {
		const typeName = type.name;
		const fields = type.getFields();
		for (const fieldName in fields) {
			const field = fields[fieldName];
			this.processFieldDirectives(typeName, field);
		}
	};

	private processFieldDirectives = (parentTypeName: string, field: GraphQLField<any, any>) => {
		const directiveAnnotations = getDirectives(this.graphQLSchema, field);
		for (const directiveAnnotation of directiveAnnotations) {
			switch (directiveAnnotation.name) {
				case 'resolveRoot':
					// processResolveRootAnnotations(field);
					break;
				case 'resolveRootField':
					// processResolveRootFieldAnnotations(field as GraphQLField<any, any>, directiveAnnotation.args.field);
					break;
				case 'pubsubOperation':
					break;
				case 'httpOperation':
					this.processHttpOperation(parentTypeName, field, directiveAnnotation.args as HTTPRootFieldResolverOpts);
					break;
				case 'responseMetadata':
					// processResponseMetadataAnnotations(field as GraphQLField<any, any>);
					break;
				case 'link':
					// processLinkFieldAnnotations(
					// 	field as GraphQLField<any, any>,
					// 	directiveAnnotation.args.defaultRootType,
					// 	directiveAnnotation.args.defaultField
					// );
					break;
				case 'dictionary':
				// processDictionaryDirective(fields as Record<string, GraphQLField<any, any>>, field as GraphQLField<any, any>);
			}
		}
	};

	private processHttpOperation = (
		parentTypeName: string,
		field: GraphQLField<any, any>,
		directiveArgs: HTTPRootFieldResolverOpts
	) => {
		const {
			path,
			operationSpecificHeaders,
			httpMethod,
			isBinary,
			requestBaseBody,
			queryParamArgMap,
			queryStringOptionsByParam,
		} = directiveArgs;

		const operationHeaders = this.getOperationHeaders(operationSpecificHeaders);
		const operationEndpoint = this.getEndpoint();
		const operationPath = this.getOperationPath(path);
		const verb = this.getMethod(httpMethod);

		this.addDataSource(
			parentTypeName,
			field.name,
			verb,
			operationHeaders,
			operationPath,
			operationEndpoint,
			mapInputVariable(''),
			[],
			false
		);
	};

	private getEndpoint = (): ConfigurationVariable => {
		// TODO: this is not correct
		// we should get it from the global options
		// or from the introspection

		if (this.introspection.baseURL) {
			// TODO: implement me
		}

		const endpoint: ConfigurationVariable = mapInputVariable(interpolationToTemplate('DUMMY'));

		return endpoint;
	};

	private getMethod = (verb: OmnigraphHTTPMethod): HTTPMethod => {
		switch (verb) {
			case 'GET':
				return HTTPMethod.GET;
			case 'POST':
				return HTTPMethod.POST;
			case 'PUT':
				return HTTPMethod.PUT;
			case 'DELETE':
				return HTTPMethod.DELETE;
			// case 'PATCH':
			// 	return HTTPMethod.PATCH; // TODO: add support to protobuf
			default:
				throw new Error(`Unsupported HTTP method: ${verb}`);
		}
	};

	private getOperationPath = (path: string): ConfigurationVariable => {
		return mapInputVariable(interpolationToTemplate(path));
	};

	private getOperationHeaders = (operationSpecificHeaders: Record<string, string>): DataSourceHeaders => {
		let headers: DataSourceHeaders = {};

		// 1. set global headers
		// TODO: implement me

		// 2. set headers specific to this operation
		if (operationSpecificHeaders) {
			for (const headerName in operationSpecificHeaders) {
				const nonInterpolatedValue = operationSpecificHeaders[headerName];
				const valueTemplate = interpolationToTemplate(nonInterpolatedValue);

				headers[headerName.toLowerCase()] = {
					values: [mapInputVariable(valueTemplate)],
				};
			}
		}

		// 3. set introspection headers
		for (const headerName in this.headers) {
			headers[headerName] = this.headers[headerName];
		}

		return headers;
	};
}

export const interpolationToTemplate = (interpolation: string): string => {
	return interpolation.replace(/{args./g, '{{ .arguments.').replace(/}/g, ' }}');
};
