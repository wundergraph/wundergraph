import {
	buildMTLSConfiguration,
	buildUpstreamAuthentication,
	DataSource,
	OpenAPIIntrospection,
	RESTApi,
	RESTApiCustom,
} from '../definition';
import swagger2openapi from 'swagger2openapi';
import {
	buildASTSchema,
	DefinitionNode,
	DocumentNode,
	EnumTypeDefinitionNode,
	EnumValueDefinitionNode,
	FieldDefinitionNode,
	InputObjectTypeDefinitionNode,
	InputValueDefinitionNode,
	Kind,
	ObjectTypeDefinitionNode,
	parse,
	print,
	printSchema,
	ScalarTypeDefinitionNode,
	TypeNode,
	UnionTypeDefinitionNode,
	visit,
} from 'graphql';
import { JSONSchema7 as JSONSchema, JSONSchema7Type } from 'json-schema';
import { ListTypeNode, NamedTypeNode } from 'graphql/language/ast';
import {
	ArgumentRenderConfiguration,
	ArgumentSource,
	ConfigurationVariableKind,
	DataSourceKind,
	FieldConfiguration,
	HTTPHeader,
	HTTPMethod,
	hTTPMethodToJSON,
} from '@wundergraph/protobuf';
import yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';
import {
	applyNamespaceToExistingRootFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
} from '../definition/namespacing';
import { EnvironmentVariable, InputVariable, mapInputVariable } from '../configure/variables';
import { HeadersBuilder, mapHeaders } from '../definition/headers-builder';
import { Logger } from '../logger';
import _ from 'lodash';
import transformSchema from '../transformations/transformSchema';

export const openApiSpecificationToRESTApiObject = async (
	oas: string,
	introspection: OpenAPIIntrospection
): Promise<RESTApi> => {
	try {
		const specObject = JSON.parse(oas, fixOasReplacer);
		const spec = await convertOpenApiV3(specObject);
		const builder = new RESTApiBuilder(spec, introspection);
		return builder.build();
	} catch (e) {
		const obj = yaml.load(oas) as Object;
		if (obj) {
			const spec = await convertOpenApiV3(obj);
			const builder = new RESTApiBuilder(spec, introspection);
			return builder.build();
		}
		throw new Error('cannot read OAS');
	}
};

interface SchemaTraverseOptions {
	isRootField: boolean;
	parentTypeName: string;
	fieldName: string;
	argumentName?: string;
	schema: JSONSchema;
	path: string;
	verb: HTTPMethod;
	objectKind: ObjectKind;
	enclosingTypes: EnclosingType[];
	statusCode?: string;
	responseObjectDescription?: string;
}

type EnclosingType = 'non_null' | 'list';

type ObjectKind = 'input' | 'type' | 'enum' | 'scalar';

class RESTApiBuilder {
	constructor(spec: OpenAPIV3.Document, introspection: OpenAPIIntrospection) {
		this.spec = spec;
		this.graphQLSchema = {
			kind: Kind.DOCUMENT,
			definitions: [
				this.buildObjectTypeDefinitionNode('Query', []),
				this.buildObjectTypeDefinitionNode('Mutation', []),
				this.buildObjectTypeDefinitionNode('Subscription', []),
			],
		};
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
	private graphQLSchema: DocumentNode;
	private dataSources: DataSource<RESTApiCustom>[] = [];
	private fields: FieldConfiguration[] = [];
	private baseUrlArgs: string[] = [];

	public build = (): RESTApi => {
		Object.keys(this.spec.paths).forEach((path) => {
			const pathObject = this.spec.paths[path];
			if (pathObject === undefined) {
				return;
			}
			if (pathObject.get) {
				this.traversePath(pathObject.get, pathObject, path, HTTPMethod.GET);
			}
			if (pathObject.post) {
				this.traversePath(pathObject.post, pathObject, path, HTTPMethod.POST);
			}
			if (pathObject.put) {
				this.traversePath(pathObject.put, pathObject, path, HTTPMethod.PUT);
			}
			if (pathObject.delete) {
				this.traversePath(pathObject.delete, pathObject, path, HTTPMethod.DELETE);
			}
		});
		const filtered = this.filterEmptyTypes(this.graphQLSchema);
		const { schemaSDL: replaced } = transformSchema.replaceCustomScalars(print(filtered), this.introspection);
		const schema = buildASTSchema(parse(replaced));
		const schemaString = printSchema(schema);
		const dataSources = this.dataSources.map((ds) => {
			return {
				...ds,
				RootNodes: applyNameSpaceToTypeFields(ds.RootNodes, schema, this.apiNamespace),
				ChildNodes: applyNameSpaceToTypeFields(ds.ChildNodes, schema, this.apiNamespace),
			};
		});
		if (this.baseUrlArgs.length) {
			this.baseUrlArgs.forEach((arg) => {
				this.fields.map((field) => ({
					...field,
					argumentsConfiguration: [
						...(field.argumentsConfiguration || []),
						{
							name: arg,
							renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_ARRAY_CSV,
							sourceType: ArgumentSource.FIELD_ARGUMENT,
							sourcePath: [arg],
						},
					],
				}));
			});
		}
		return new RESTApi(
			applyNameSpaceToGraphQLSchema(schemaString, [], this.apiNamespace),
			dataSources,
			applyNamespaceToExistingRootFieldConfigurations(this.fields, schema, this.apiNamespace),
			[],
			[]
		);
	};
	private traversePath = (
		operationObject: OpenAPIV3.OperationObject,
		pathItemObject: OpenAPIV3.PathItemObject,
		path: string,
		verb: HTTPMethod
	) => {
		const fieldName = getFormattedFieldName(this.resolveFieldName(operationObject, path, verb));
		if (!operationObject.responses) {
			return;
		}
		const parentType = verb === HTTPMethod.GET ? 'Query' : 'Mutation';

		const baseUrl = this.cleanupBaseURL(this.baseURL());

		this.dataSources.push({
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
					path: mapInputVariable(path),
					baseUrl: mapInputVariable(baseUrl),
					url: mapInputVariable(''),
					body: mapInputVariable(''),
					header: this.headers,
					query: [],
					mTLS: buildMTLSConfiguration(this.introspection),
					upstreamAuthentication: buildUpstreamAuthentication(this.introspection),
					urlEncodeBody: false,
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
		});

		const isJsonResponse = Object.keys(operationObject.responses).length === 0;

		this.fields.push({
			typeName: parentType,
			fieldName: fieldName,
			disableDefaultFieldMapping: true,
			argumentsConfiguration: [],
			requiresFields: [],
			path: [],
			unescapeResponseJson: isJsonResponse,
		});

		if (isJsonResponse) {
			this.ensureType('scalar', 'JSON');
			this.addField(parentType, 'type', fieldName, 'JSON', []);
		}
		Object.keys(operationObject.responses).forEach((statusCode) => {
			if (!this.statusCodeUnions && statusCode !== '200') {
				return;
			}
			const responseObject = this.resolveResponseObject(operationObject.responses![statusCode]);
			if (!responseObject) {
				return;
			}
			if (!responseObject.content || !responseObject.content['application/json']) {
				if (this.statusCodeUnions) {
					const fieldTypeName = this.buildFieldTypeName(
						fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1),
						responseObject.description || '',
						statusCode || ''
					);
					this.ensureStatusCodeObject(fieldTypeName);
					this.addResponseUnionField(parentType, 'type', fieldName, fieldTypeName, statusCode, true);
				} else {
					this.ensureType('scalar', 'JSON');
					this.addField(parentType, 'type', fieldName, 'JSON', []);
				}
				return;
			}
			const mediaTypeObject = responseObject.content['application/json'];
			const schema = mediaTypeObject.schema as JSONSchema;
			this.traverseSchema({
				isRootField: true,
				parentTypeName: parentType,
				fieldName: fieldName,
				schema: schema,
				path: path,
				verb: verb,
				objectKind: 'type',
				enclosingTypes: [],
				statusCode: statusCode,
				responseObjectDescription: responseObject!.description,
			});
			if (this.baseUrlArgs.length) {
				this.baseUrlArgs.forEach((arg) => {
					this.addArgument(parentType, fieldName, arg, 'String', ['non_null']);
				});
			}
		});
		const parameters = [...(pathItemObject.parameters || []), ...(operationObject.parameters || [])];
		parameters.map(this.resolveParamsObject).forEach((param) => {
			if (!param) {
				return;
			}
			const schema = param.schema as JSONSchema;
			this.traverseSchema({
				parentTypeName: parentType,
				fieldName: fieldName,
				argumentName: param.name,
				schema,
				isRootField: true,
				verb,
				path,
				objectKind: 'input',
				enclosingTypes: param.required ? ['non_null'] : [],
			});
			switch (param.in) {
				case 'query':
					this.dataSources[this.dataSources.length - 1].Custom.Fetch.query = [
						...(this.dataSources[this.dataSources.length - 1].Custom.Fetch.query || []),
						{
							name: param.name,
							value: `{{ .arguments.${this.sanitizeName(param.name)} }}`,
						},
					];
					break;
				case 'header':
					this.dataSources[this.dataSources.length - 1].Custom.Fetch.header = {
						...this.dataSources[this.dataSources.length - 1].Custom.Fetch.header,
						[param.name]: {
							values: [
								{
									kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
									staticVariableContent: `{{ .arguments.${param.name} }`,
									environmentVariableName: '',
									environmentVariableDefaultValue: '',
									placeholderVariableName: '',
								},
							],
						},
					};
					break;
				case 'path':
					this.dataSources[this.dataSources.length - 1].Custom.Fetch.path!.staticVariableContent = this.dataSources[
						this.dataSources.length - 1
					].Custom.Fetch.path!.staticVariableContent.replace(`{${param.name}}`, `{{ .arguments.${param.name} }}`);
					if ((param.schema as OpenAPIV3.SchemaObject).type === 'array') {
						const rootNode = this.dataSources[this.dataSources.length - 1].RootNodes[0];
						const fieldConfiguration = this.fields.find(
							(field) => field.typeName === rootNode.typeName && field.fieldName === rootNode.fieldNames[0]
						);
						if (!fieldConfiguration) {
							break;
						}
						fieldConfiguration.argumentsConfiguration.push({
							name: param.name,
							renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_ARRAY_CSV,
							sourceType: ArgumentSource.FIELD_ARGUMENT,
							sourcePath: [param.name],
							renameTypeTo: '',
						});
					}
					break;
				case 'cookie':
					Logger.debug('param.in not implemented for cookie');
					break;
			}
		});
		if (operationObject.requestBody) {
			const body = this.resolveRequestBody(operationObject.requestBody);
			if (!body) {
				return;
			}
			const applicationJSON = body!.content['application/json'];
			const urlEncoded = body!.content['application/x-www-form-urlencoded'];
			if (applicationJSON === undefined && urlEncoded === undefined) {
				return;
			}
			const schema =
				urlEncoded !== undefined ? (urlEncoded.schema as JSONSchema) : (applicationJSON.schema as JSONSchema);
			const argumentName = this.resolveArgumentName(schema, path, verb);
			this.traverseSchema({
				argumentName: argumentName,
				fieldName: fieldName,
				enclosingTypes: body.required ? ['non_null'] : [],
				parentTypeName: parentType,
				isRootField: true,
				objectKind: 'input',
				path,
				verb,
				schema,
			});
			this.dataSources[this.dataSources.length - 1].Custom.Fetch.urlEncodeBody = urlEncoded !== undefined;
			this.dataSources[this.dataSources.length - 1].Custom.Fetch.body = {
				kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
				staticVariableContent: `{{ .arguments.${argumentName} }}`,
				environmentVariableName: '',
				environmentVariableDefaultValue: '',
				placeholderVariableName: '',
			};
		}
	};
	private traverseSchema = (options: SchemaTraverseOptions) => {
		let {
			argumentName,
			schema,
			objectKind,
			enclosingTypes,
			parentTypeName,
			fieldName,
			path,
			verb,
			isRootField,
			statusCode,
			responseObjectDescription,
		} = options;
		schema = this.resolveSingleSchemaOneOf(schema);
		let ref = this.resolveSchemaRef(schema);
		if (ref) {
			const resolved = this.jsonSchemaFromRef(ref, enclosingTypes);
			if (!resolved) {
				return;
			}
			const componentSchema = resolved.schema;
			const type = componentSchema.type;
			if (
				!componentSchema.enum &&
				type &&
				(['boolean', 'integer', 'number', 'string'] as JSONSchema7Type[]).includes(type)
			) {
				// Primitive type references use the referenced schema as their own
				schema = componentSchema;
			} else {
				ref = resolved.ref;
				let fieldTypeName = ref;

				if (objectKind === 'input') {
					fieldTypeName = `${fieldTypeName}Input`;
				}

				const isIntEnum = componentSchema.enum && componentSchema.type === 'integer';
				if (argumentName) {
					this.addArgument(parentTypeName, fieldName, argumentName, isIntEnum ? 'Int' : fieldTypeName, enclosingTypes);
				} else if (this.statusCodeUnions && isRootField && objectKind === 'type') {
					fieldTypeName = this.buildFieldTypeName(ref, responseObjectDescription || '', statusCode || '');
					this.addResponseUnionField(parentTypeName, objectKind, fieldName, fieldTypeName, statusCode || '', false);
				} else {
					this.addField(parentTypeName, objectKind, fieldName, isIntEnum ? 'Int' : fieldTypeName, enclosingTypes);
				}
				if (isIntEnum) return;

				const created = this.ensureType(
					componentSchema.enum && componentSchema.type === 'string' ? 'enum' : objectKind,
					fieldTypeName
				);
				if (!created) {
					return;
				}
				this.traverseSchema({
					isRootField: false,
					objectKind,
					schema: componentSchema,
					enclosingTypes: [],
					parentTypeName: fieldTypeName,
					fieldName: '',
					verb,
					path,
				});
				return;
			}
		}
		if (schema.allOf) {
			schema = (schema.allOf! as JSONSchema[]).map(this.resolveSchema).reduce(this.mergeJSONSchemas);
		}
		if (schema.type === undefined) {
			this.ensureType('scalar', 'JSON');
			if (argumentName) {
				this.addArgument(parentTypeName, fieldName, argumentName, 'JSON', enclosingTypes);
				return;
			}
			this.addField(parentTypeName, objectKind, fieldName, 'JSON', enclosingTypes);
			return;
		}
		switch (schema.type) {
			case 'integer':
				if (argumentName) {
					this.addArgument(parentTypeName, fieldName, argumentName, 'Int', enclosingTypes);
					return;
				}
				this.addField(parentTypeName, objectKind, fieldName, 'Int', enclosingTypes);
				return;
			case 'null':
				return;
			case 'string':
				if (schema.enum) {
					if (
						argumentName &&
						schema.enum.constructor === Array &&
						schema.enum.length !== 0 &&
						typeof schema.enum[0] === 'number'
					) {
						this.addArgument(parentTypeName, fieldName, argumentName, 'Int', enclosingTypes);
						return;
					}
					if (argumentName) {
						const enumName = fieldName + '_' + argumentName;
						this.ensureType('enum', enumName);
						this.addArgument(parentTypeName, fieldName, argumentName, enumName, enclosingTypes);
						this.addEnumValues(enumName, schema.enum);
						return;
					}
					this.addEnumValues(parentTypeName, schema.enum);
					return;
				}
				if (argumentName) {
					this.addArgument(parentTypeName, fieldName, argumentName, 'String', enclosingTypes);
					return;
				}
				this.addField(parentTypeName, objectKind, fieldName, 'String', enclosingTypes);
				return;
			case 'boolean':
				if (argumentName) {
					this.addArgument(parentTypeName, fieldName, argumentName, 'Boolean', enclosingTypes);
					return;
				}
				this.addField(parentTypeName, objectKind, fieldName, 'Boolean', enclosingTypes);
				return;
			case 'number':
				if (argumentName) {
					this.addArgument(parentTypeName, fieldName, argumentName, 'Int', enclosingTypes);
					return;
				}
				this.addField(parentTypeName, objectKind, fieldName, 'Int', enclosingTypes);
				return;
			case 'array':
				this.traverseSchema({
					...options,
					schema: schema.items as JSONSchema,
					enclosingTypes: [...enclosingTypes, 'list'],
				});
				return;
			case 'object':
				if (!schema.properties) {
					if (schema?.additionalProperties && schema.additionalProperties !== false) {
						this.ensureType('scalar', 'JSON');
						this.addField(parentTypeName, objectKind, fieldName, 'JSON', enclosingTypes);
					}
					return;
				}
				if (argumentName) {
					if (schema.required?.length) {
						if (enclosingTypes.length !== 0 && enclosingTypes[enclosingTypes.length - 1] !== 'non_null') {
							enclosingTypes.push('non_null');
						}
					}
					this.addArgument(parentTypeName, fieldName, argumentName, argumentName, enclosingTypes);
					this.ensureType('input', argumentName);
					Object.keys(schema.properties).forEach((prop) => {
						this.traverseSchema({
							isRootField: false,
							enclosingTypes: schema.required?.find((req) => req === prop) !== undefined ? ['non_null'] : [],
							fieldName: prop,
							objectKind: 'input',
							parentTypeName: argumentName!,
							path,
							verb,
							schema: schema.properties![prop] as JSONSchema,
						});
					});
					return;
				}
				if (fieldName !== '') {
					let typeName = schema.title
						? schema.title.replace(' ', '')
						: parentTypeName + fieldName[0].toUpperCase() + fieldName.substring(1);
					if (objectKind === 'input') {
						typeName += 'Input';
					}
					typeName = this.cleanupTypeName(typeName, parentTypeName);
					let fieldTypeName = typeName;
					if (this.statusCodeUnions && isRootField && objectKind === 'type') {
						fieldTypeName = this.buildFieldTypeName(typeName, responseObjectDescription || '', statusCode || '');
						this.addResponseUnionField(parentTypeName, objectKind, fieldName, fieldTypeName, statusCode || '', false);
					} else {
						this.addField(parentTypeName, objectKind, fieldName, typeName, enclosingTypes);
					}
					const created = this.ensureType(objectKind, fieldTypeName);
					if (!created) {
						return;
					}
					Object.keys(schema.properties).forEach((prop) => {
						this.traverseSchema({
							isRootField: false,
							enclosingTypes: schema.required?.find((req) => req === prop) !== undefined ? ['non_null'] : [],
							fieldName: prop,
							objectKind: objectKind,
							parentTypeName: fieldTypeName,
							path,
							verb,
							schema: schema.properties![prop] as JSONSchema,
						});
					});
					return;
				}
				Object.keys(schema.properties).forEach((prop) => {
					this.traverseSchema({
						isRootField: false,
						enclosingTypes: schema.required?.find((req) => req === prop) !== undefined ? ['non_null'] : [],
						fieldName: prop,
						objectKind: objectKind,
						parentTypeName: parentTypeName,
						path,
						verb,
						schema: schema.properties![prop] as JSONSchema,
					});
				});
		}
	};
	private buildFieldTypeName = (fieldTypeName: string, description: string, statusCode: string): string => {
		if (description !== '') {
			const parts = description.split(' ').map((part) => part.substring(0, 1).toUpperCase() + part.substring(1));
			const combined = fieldTypeName + parts.join('');
			if (/^[a-zA-Z0-9]+$/.test(combined)) {
				return combined;
			}
		}
		return fieldTypeName + statusCode;
	};
	private ensureStatusCodeObject = (name: string) => {
		const object: ObjectTypeDefinitionNode = {
			name: {
				kind: Kind.NAME,
				value: name,
			},
			kind: Kind.OBJECT_TYPE_DEFINITION,
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'statusCode',
					},
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Int',
							},
						},
					},
				},
			],
		};
		this.graphQLSchema = {
			...this.graphQLSchema,
			definitions: [...this.graphQLSchema.definitions, object],
		};
	};
	private ensureType = (objectKind: ObjectKind, ref: string): boolean => {
		const exists =
			this.graphQLSchema.definitions.find((value) => {
				switch (objectKind) {
					case 'type':
						return value.kind === 'ObjectTypeDefinition' && value.name.value === ref;
					case 'input':
						return value.kind === 'InputObjectTypeDefinition' && value.name.value === ref;
					case 'enum':
						return value.kind === 'EnumTypeDefinition' && value.name.value === ref;
					case 'scalar':
						return value.kind === 'ScalarTypeDefinition' && value.name.value === ref;
					default:
						throw new Error('must implement objectKind');
				}
			}) !== undefined;
		if (exists) {
			return false;
		}
		let node: DefinitionNode | undefined;
		switch (objectKind) {
			case 'type':
				node = this.buildObjectTypeDefinitionNode(ref, []);
				break;
			case 'input':
				node = this.buildInputObjectTypeDefinitionNode(ref, []);
				break;
			case 'enum':
				node = this.buildEnumTypeDefinitionNode(ref, []);
				break;
			case 'scalar':
				node = this.buildScalarTypeDefinitionNode(ref);
				break;
		}
		if (!node) {
			return false;
		}
		this.graphQLSchema = {
			...this.graphQLSchema,
			definitions: [...this.graphQLSchema.definitions, node],
		};
		return true;
	};
	private baseURL = (): InputVariable => {
		if (this.introspection.baseURL) {
			return this.introspection.baseURL;
		}
		if (!this.spec.servers || this.spec.servers.length === 0) {
			throw new Error('OpenAPISpecification must contain server + url');
		}
		const secure = this.spec.servers.find((server) => server.url.startsWith('https'));
		return secure ? secure.url : this.spec.servers[0].url;
	};
	private cleanupBaseURL = (url: InputVariable): InputVariable => {
		if ((url as EnvironmentVariable).name) {
			return url;
		}
		if (typeof url !== 'string') {
			throw new Error('url must be an environment variable or a string');
		}
		return url.replace(/{[a-zA-Z]+}/, (str) => {
			const arg = this.sanitizeName(str.substring(1, str.length - 1));
			this.baseUrlArgs.push(arg);
			return `{{ .arguments.${arg} }}`;
		});
	};
	private buildScalarTypeDefinitionNode = (name: string): ScalarTypeDefinitionNode => {
		return {
			kind: Kind.SCALAR_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: name,
			},
		};
	};
	private addArgument = (
		typeName: string,
		fieldName: string,
		argumentName: string,
		argumentType: string,
		enclosingTypes: EnclosingType[]
	) => {
		argumentName = this.sanitizeName(argumentName);
		const resolvedArgType = this.resolveTypeNode(argumentType, enclosingTypes);
		let done = false;
		this.graphQLSchema = visit(this.graphQLSchema, {
			ObjectTypeDefinition: (node) => {
				if (node.name.value !== typeName) {
					return false;
				}
			},
			FieldDefinition: {
				enter: (node) => {
					if (node.name.value !== fieldName) {
						return;
					}
					const arg = node.arguments?.find((arg) => arg.name.value === argumentName);
					if (arg) {
						done = true;
						return;
					}
					const update: FieldDefinitionNode = {
						...node,
						arguments: [
							...(node.arguments || []),
							{
								kind: Kind.INPUT_VALUE_DEFINITION,
								name: {
									kind: Kind.NAME,
									value: argumentName,
								},
								type: resolvedArgType,
							},
						],
					};
					done = true;
					return update;
				},
			},
		});
	};
	private addResponseUnionField = (
		parentName: string,
		objectKind: ObjectKind,
		fieldName: string,
		fieldTypeName: string,
		statusCode: string,
		statusCodeOnly: boolean
	) => {
		const fieldType: NamedTypeNode = {
			kind: Kind.NAMED_TYPE,
			name: {
				kind: Kind.NAME,
				value: fieldTypeName,
			},
		};
		if (objectKind !== 'type') {
			return;
		}
		const unionTypeName = fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1) + 'Response';
		const unionExists =
			this.graphQLSchema.definitions.find(
				(node) => node.kind === 'UnionTypeDefinition' && node.name.value === unionTypeName
			) !== undefined;
		const defaultResponseDefinitionExists =
			this.graphQLSchema.definitions.find(
				(node) => node.kind === 'ObjectTypeDefinition' && node.name.value === 'UnspecifiedHttpResponse'
			) !== undefined;
		this.dataSources[this.dataSources.length - 1].Custom.StatusCodeTypeMappings.push({
			typeName: this.apiNamespace ? this.apiNamespace + '_' + fieldTypeName : fieldTypeName,
			statusCode: parseInt(statusCode, 10),
			injectStatusCodeIntoBody: statusCodeOnly,
		});
		if (unionExists) {
			this.graphQLSchema = visit(this.graphQLSchema, {
				UnionTypeDefinition: (node) => {
					if (node.name.value === unionTypeName) {
						if (node.types?.find((t) => t.name.value === fieldTypeName) !== undefined) {
							return;
						}
						const updated: UnionTypeDefinitionNode = {
							...node,
							types: [...(node.types || []), fieldType],
						};
						return updated;
					}
				},
			});
			return;
		}
		const extension = `
        union ${unionTypeName} = UnspecifiedHttpResponse | ${fieldTypeName}
        `;
		const defaultResponseDefinition = `
        type UnspecifiedHttpResponse {
            statusCode: Int!
        }
        `;
		const allExtension = defaultResponseDefinitionExists ? extension : extension + defaultResponseDefinition;
		const existingSchema = print(this.graphQLSchema);
		this.graphQLSchema = parse(existingSchema + allExtension);
		this.graphQLSchema = visit(this.graphQLSchema, {
			ObjectTypeDefinition: (node) => {
				if (node.name.value !== parentName) {
					return;
				}
				const updated: ObjectTypeDefinitionNode = {
					...node,
					fields: [
						...(node.fields || []),
						{
							kind: Kind.FIELD_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: fieldName,
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: unionTypeName,
								},
							},
						},
					],
				};
				return updated;
			},
		});
	};
	private addField = (
		parentName: string,
		objectKind: ObjectKind,
		fieldName: string,
		fieldTypeName: string,
		enclosingTypes: EnclosingType[]
	) => {
		const isJSONField = fieldTypeName === 'JSON';

		const fieldType = this.resolveTypeNode(fieldTypeName, enclosingTypes);
		// remove non alphanumeric characters as well as leading numbers
		const sanitizedFieldName = fieldName.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[0-9]+/, '');
		if (sanitizedFieldName !== fieldName) {
			// add mapping
			this.fields.push({
				typeName: parentName,
				fieldName: sanitizedFieldName,
				disableDefaultFieldMapping: true,
				path: [fieldName],
				requiresFields: [],
				unescapeResponseJson: isJSONField,
				argumentsConfiguration: [],
			});
		} else if (isJSONField) {
			let field: FieldConfiguration | undefined = this.fields.find(
				(f) => f.typeName === parentName && f.fieldName === fieldName
			);
			if (!field) {
				this.fields.push({
					typeName: parentName,
					fieldName: fieldName,
					disableDefaultFieldMapping: true,
					argumentsConfiguration: [],
					requiresFields: [],
					path: [],
					unescapeResponseJson: true,
				});
			} else {
				field.unescapeResponseJson = true;
			}
		}
		if (objectKind === 'type') {
			this.graphQLSchema = visit(this.graphQLSchema, {
				ObjectTypeDefinition: (node) => {
					if (node.name.value !== parentName) {
						return;
					}
					const updated: ObjectTypeDefinitionNode = {
						...node,
						fields: [
							...(node.fields || []),
							{
								kind: Kind.FIELD_DEFINITION,
								name: {
									kind: Kind.NAME,
									value: sanitizedFieldName,
								},
								type: fieldType,
							},
						],
					};
					return updated;
				},
			});
		} else if (objectKind === 'input') {
			this.graphQLSchema = visit(this.graphQLSchema, {
				InputObjectTypeDefinition: (node) => {
					if (node.name.value !== parentName) {
						return;
					}
					const updated: InputObjectTypeDefinitionNode = {
						...node,
						fields: [
							...(node.fields || []),
							{
								kind: Kind.INPUT_VALUE_DEFINITION,
								name: {
									kind: Kind.NAME,
									value: sanitizedFieldName,
								},
								type: fieldType,
							},
						],
					};
					return updated;
				},
			});
		}
	};
	private addEnumValues = (enumTypeName: string, values: JSONSchema7Type[]) => {
		const nodes: EnumValueDefinitionNode[] = [];
		values.forEach((value) => {
			if (typeof value !== 'string') {
				return;
			}
			const exists = nodes.find((node) => node.name.value === value) !== undefined;
			if (exists) {
				return;
			}
			nodes.push({
				kind: Kind.ENUM_VALUE_DEFINITION,
				name: {
					kind: Kind.NAME,
					value: value,
				},
			});
		});
		if (nodes.length === 0) {
			return;
		}
		this.graphQLSchema = visit(this.graphQLSchema, {
			EnumTypeDefinition: (node) => {
				if (node.name.value !== enumTypeName) {
					return;
				}
				const update: EnumTypeDefinitionNode = {
					...node,
					values: [...(node.values || []), ...nodes],
				};
				return update;
			},
		});
	};
	private resolveTypeNode = (namedTypeName: string, enclosingTypes: EnclosingType[], suffix?: string): TypeNode => {
		if (enclosingTypes.length !== 0) {
			const first = enclosingTypes.shift()!;
			switch (first) {
				case 'list':
					return {
						kind: Kind.LIST_TYPE,
						type: this.resolveTypeNode(namedTypeName, enclosingTypes),
					};
				case 'non_null':
					return {
						kind: Kind.NON_NULL_TYPE,
						type: this.resolveTypeNode(namedTypeName, enclosingTypes) as NamedTypeNode | ListTypeNode,
					};
			}
		}
		return {
			kind: Kind.NAMED_TYPE,
			name: {
				kind: Kind.NAME,
				value: suffix ? namedTypeName + suffix : namedTypeName,
			},
		};
	};
	private resolveSingleSchemaOneOf = (schema: JSONSchema) => {
		if (schema.oneOf && schema.oneOf.length === 1) {
			return schema.oneOf[0] as JSONSchema;
		}
		return schema;
	};
	private resolveParamsObject = (
		object: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
	): undefined | OpenAPIV3.ParameterObject => {
		if ((object as OpenAPIV3.ReferenceObject).$ref) {
			const ref = (object as OpenAPIV3.ReferenceObject).$ref;
			if (this.spec.components && this.spec.components.parameters)
				return this.spec.components.parameters[ref] as undefined | OpenAPIV3.ParameterObject;
			return undefined;
		}
		return object as OpenAPIV3.ParameterObject;
	};
	private resolveRequestBody = (
		request: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
	): undefined | OpenAPIV3.RequestBodyObject => {
		if ((request as OpenAPIV3.ReferenceObject).$ref) {
			const ref = (request as OpenAPIV3.ReferenceObject).$ref;
			if (this.spec.components && this.spec.components.requestBodies) {
				return this.spec.components.requestBodies[ref] as undefined | OpenAPIV3.RequestBodyObject;
			}
		}
		return request as OpenAPIV3.RequestBodyObject;
	};
	private resolveResponseObject = (
		responseObject: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
	): OpenAPIV3.ResponseObject | undefined => {
		const ref = (responseObject as OpenAPIV3.ReferenceObject).$ref || undefined;
		if (ref) {
			const schemaName = this.componentName(ref, 'responses');
			if (!schemaName) {
				return;
			}
			const resolvedSchema =
				this.spec.components && this.spec.components.responses && this.spec.components.responses[schemaName];
			if (!resolvedSchema) {
				return;
			}
			if ((resolvedSchema as OpenAPIV3.ReferenceObject).$ref) {
				return;
			}
			return resolvedSchema as OpenAPIV3.ResponseObject;
		}
		return responseObject as OpenAPIV3.ResponseObject;
	};
	private filterEmptyTypes = (document: DocumentNode): DocumentNode => {
		return visit(document, {
			ObjectTypeDefinition: (node) => {
				if (!node.fields || node.fields.length === 0) {
					return null;
				}
			},
			InterfaceTypeDefinition: (node) => {
				if (!node.fields || node.fields.length === 0) {
					return null;
				}
			},
			EnumTypeDefinition: (node) => {
				if (!node.values || node.values.length === 0) {
					return null;
				}
			},
			UnionTypeDefinition: (node) => {
				if (!node.types || node.types.length === 0) {
					return null;
				}
			},
		});
	};
	private resolveSchema = (value: JSONSchema): JSONSchema => {
		if (value.$ref) {
			const refPath = value.$ref!.substring(2).split('/');
			if (refPath.length !== 3 || refPath[0] !== 'components' || refPath[1] !== 'schemas') {
				return {};
			}
			const typeName = refPath[2];
			if (!this.spec.components || !this.spec.components.schemas) {
				return {};
			}
			const schema = this.spec.components.schemas[typeName];
			return this.resolveSchema(schema as JSONSchema);
		}
		if (value.oneOf && value.oneOf!.length === 1) {
			return this.resolveSchema(value.oneOf[0] as JSONSchema);
		}
		if (value.allOf) {
			return (value.allOf! as JSONSchema[]).map(this.resolveSchema).reduce(this.mergeJSONSchemas);
		}
		return value as JSONSchema;
	};
	private componentName = (ref: string, componentType: 'schemas' | 'responses'): string | undefined => {
		if (ref.startsWith('#/')) {
			const refPath = ref.substring(2).split('/');
			if (refPath.length !== 3 || refPath[0] !== 'components' || refPath[1] !== componentType) {
				return;
			}
			return refPath[2];
		}
	};
	private resolveSchemaRef = (schema: JSONSchema): string | undefined => {
		if (schema.$ref && schema.$ref.startsWith('#/')) {
			const refPath = schema.$ref.substring(2).split('/');
			if (refPath.length !== 3 || refPath[0] !== 'components' || refPath[1] !== 'schemas') {
				return;
			}
			return refPath[2];
		}
	};
	private jsonSchemaFromRef = (
		ref: string,
		enclosingTypes: EnclosingType[]
	): { schema: JSONSchema; ref: string } | undefined => {
		if (this.spec.components && this.spec.components.schemas && this.spec.components.schemas[ref]) {
			const schema = this.spec.components.schemas[ref] as JSONSchema;
			if (schema.type === 'array') {
				enclosingTypes.push('list');
				const itemsSchema = schema.items as JSONSchema;
				const itemsRef = this.resolveSchemaRef(itemsSchema);
				if (itemsRef) {
					return this.jsonSchemaFromRef(itemsRef, enclosingTypes);
				}
				return { schema: itemsSchema, ref };
			}
			return { schema, ref };
		}
		return undefined;
	};
	private mergeJSONSchemas = (previous: JSONSchema, next: JSONSchema): JSONSchema => {
		if (previous.type !== next.type) {
			return previous;
		}
		return {
			...previous,
			properties: {
				...previous.properties,
				...next.properties,
			},
			required: [...(previous.required || []), ...(next.required || [])],
			additionalProperties: previous.additionalProperties || next.additionalProperties,
		};
	};
	private buildObjectTypeDefinitionNode = (name: string, fields: FieldDefinitionNode[]): ObjectTypeDefinitionNode => {
		return {
			kind: Kind.OBJECT_TYPE_DEFINITION,
			fields: fields,
			name: {
				kind: Kind.NAME,
				value: name,
			},
		};
	};
	private buildInputObjectTypeDefinitionNode = (
		name: string,
		fields: InputValueDefinitionNode[]
	): InputObjectTypeDefinitionNode => {
		return {
			kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
			fields: fields,
			name: {
				kind: Kind.NAME,
				value: name,
			},
		};
	};
	private buildEnumTypeDefinitionNode = (name: string, values: EnumValueDefinitionNode[]): EnumTypeDefinitionNode => {
		return {
			kind: Kind.ENUM_TYPE_DEFINITION,
			values,
			name: {
				kind: Kind.NAME,
				value: name,
			},
		};
	};
	private resolveFieldName = (operationObject: OpenAPIV3.OperationObject, path: string, verb: HTTPMethod): string => {
		if (operationObject.operationId) {
			if (operationObject.operationId.startsWith('/')) {
				return operationObject.operationId.substring(1);
			}
			return operationObject.operationId;
		}
		const formattedPath = getFormattedPath(path);
		return hTTPMethodToJSON(verb).toLowerCase() + formattedPath[0].toUpperCase() + formattedPath.substring(1);
	};

	private resolveArgumentName(schema: JSONSchema, path: string, verb: HTTPMethod): string {
		if (schema.title) {
			return schema.title.replace(' ', '') + 'Input';
		}
		const formattedPath = path.split('/').reduce((prev, current) => {
			if (current.startsWith('{') && current.endsWith('}')) {
				const trimmed = current.substring(1, current.length - 1);
				return (
					prev + trimmed[0].toUpperCase() + getFormattedFieldName(trimmed.substring(1).replace(/[^_a-zA-Z0-9]/g, '_'))
				);
			}
			return (
				prev + current[0]?.toUpperCase() + getFormattedFieldName(current.substring(1).replace(/[^_a-zA-Z0-9]/g, '_'))
			);
		});
		return hTTPMethodToJSON(verb).toLowerCase() + formattedPath[0] + formattedPath.substring(1) + 'Input';
	}

	private sanitizeName = (name: string): string => {
		return name.replace(/\[]/g, '');
	};

	private cleanupTypeName = (typeName: string, parentTypeName: string): string => {
		// remove all non-alphanumeric characters and all leading numbers
		typeName = _.camelCase(typeName.replace(/[^_a-zA-Z0-9]/g, '_').replace(/^[0-9]+/, '_'));
		parentTypeName = _.camelCase(parentTypeName.replace(/[^_a-zA-Z0-9]/g, '_').replace(/^[0-9]+/, '_'));
		// and make the first character uppercase
		typeName = typeName[0].toUpperCase() + typeName.substring(1);
		parentTypeName = parentTypeName[0].toUpperCase() + parentTypeName.substring(1);
		switch (typeName) {
			case 'Query':
			case 'Mutation':
			case 'Subscription':
				return parentTypeName + typeName;
			default:
				return typeName;
		}
	};
}

export const convertOpenApiV3 = async (openApiSpec: Object): Promise<OpenAPIV3.Document> => {
	const converted = await swagger2openapi.convertObj(openApiSpec, {});
	return converted.openapi;
};

const fixOasReplacer = (key: string, value: any): any => {
	switch (key) {
		case '$type':
			// remove the field
			return undefined;
		case 'oneOf':
		case 'allOf':
		case 'anyOf':
		case 'enum':
			if (value.constructor === Array) {
				return value;
			}
			if (value['$values'] !== undefined) {
				return value['$values'];
			}
			return value;
		default:
			return value;
	}
};

export const getFormattedPath = (path: string): string => {
	let formattedPath = path.split('/').filter((element) => element !== '');
	if (formattedPath.length < 1) {
		return path;
	}
	return formattedPath.reduce((acc, curr) => {
		if (curr.startsWith('{') && curr.endsWith('}')) {
			const trimmed = curr.substring(1, curr.length - 1);
			return acc + 'By' + trimmed[0].toUpperCase() + trimmed.substring(1);
		}
		return acc + curr[0]?.toUpperCase() + curr.substring(1);
	});
};

export const getFormattedFieldName = (name: string): string => {
	const formattedName = name.split(/[_-]+/g).reduce((acc, curr) => acc + curr[0].toUpperCase() + curr.substring(1));
	return formattedName.replace(/\/+/g, '_');
};
