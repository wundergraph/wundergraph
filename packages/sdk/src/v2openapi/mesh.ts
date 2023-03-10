import { DataSource, OpenAPIIntrospection, RESTApi, RESTApiCustom } from '../definition';
import {
	buildASTSchema,
	FieldDefinitionNode,
	GraphQLSchema,
	Kind,
	ObjectTypeDefinitionNode,
	parse,
	printSchema,
	visit,
} from 'graphql';
import { FieldConfiguration, HTTPHeader } from '@wundergraph/protobuf';
import yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';
import {
	applyNamespaceToExistingRootFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
} from '../definition/namespacing';
import { HeadersBuilder, mapHeaders } from '../definition/headers-builder';
import { convertOpenApiV3 } from './index';
import { loadNonExecutableGraphQLSchemaFromJSONSchemas } from '@omnigraph/json-schema';
import { getJSONSchemaOptionsFromOpenAPIOptions } from '@omnigraph/openapi';
import { getDocumentNodeFromSchema } from '@graphql-tools/utils';
import fs from 'fs';
import { JsonSchemaOptions, Options } from './jsonSchemaOptions';

export const openApiSpecificationToRESTApiObject = async (
	oas: string,
	introspection: OpenAPIIntrospection
	// ): Promise<RESTApi> => {
) => {
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

	const builder = new RESTApiBuilder(spec, introspection);
	return builder.build();
};

class RESTApiBuilder {
	constructor(spec: OpenAPIV3.Document, introspection: OpenAPIIntrospection) {
		this.spec = spec;
		this.statusCodeUnions = introspection.statusCodeUnions || false;
		this.introspection = introspection;
		this.apiNamespace = introspection.apiNamespace;

		if (introspection.headers !== undefined) {
			this.headers = mapHeaders(introspection.headers(new HeadersBuilder()) as HeadersBuilder);
		}
	}

	private statusCodeUnions: boolean;
	private apiNamespace?: string;
	private introspection: OpenAPIIntrospection;
	private spec: OpenAPIV3.Document;
	private headers: { [key: string]: HTTPHeader } = {};
	private graphQLSchema?: GraphQLSchema;
	private dataSources: DataSource<RESTApiCustom>[] = [];
	private fields: FieldConfiguration[] = [];
	private baseUrlArgs: string[] = [];

	// public build = async (): RESTApi => {
	public build = async () => {
		const options: Options = {
			source: this.spec,
			endpoint: 'dummy-url',
			name: this.introspection.apiNamespace || 'api',
		};

		const extraOpts = new JsonSchemaOptions(options);
		const extraJSONSchemaOptions = await extraOpts.getExtraJSONSchemaOptions();

		fs.writeFileSync('MESH_extraJSONSchemaOptions.json', JSON.stringify(extraJSONSchemaOptions, null, 2));

		this.graphQLSchema = await loadNonExecutableGraphQLSchemaFromJSONSchemas(options.name, {
			...options,
			...extraJSONSchemaOptions,
		});

		fs.writeFileSync('MESH_schema.graphql', printSchema(this.graphQLSchema));

		const astNode = getDocumentNodeFromSchema(this.graphQLSchema);

		let currentNodeName = '';
		visit(astNode, {
			[Kind.OBJECT_TYPE_DEFINITION]: (node: ObjectTypeDefinitionNode) => {
				currentNodeName = node.name.value;
			},
			[Kind.FIELD_DEFINITION]: (node: FieldDefinitionNode) => {
				if (node.directives && node.directives.length > 0) {
					node.directives.forEach((directive) => {
						if (directive.name.value === 'httpOperation') {
							const meta = extraOpts.findMetaData(currentNodeName.toLowerCase(), node.name.value);

							console.log('metadata', meta);
						}
					});
				}
			},
		});

		// const schemaString: string = '';
		// const schema = buildASTSchema(parse(schemaString));
		// const dataSources = this.dataSources;
		//
		// return new RESTApi(
		// 	applyNameSpaceToGraphQLSchema(schemaString, [], this.apiNamespace),
		// 	dataSources,
		// 	applyNamespaceToExistingRootFieldConfigurations(this.fields, schema, this.apiNamespace),
		// 	[],
		// 	[]
		// );
	};
}
