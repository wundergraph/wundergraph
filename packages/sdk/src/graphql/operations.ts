import {
	Claim,
	ClaimConfig,
	InjectVariableKind,
	OperationExecutionEngine,
	OperationRoleConfig,
	OperationType,
	VariableInjectionConfiguration,
} from '@wundergraph/protobuf';
import {
	buildSchema,
	DirectiveNode,
	DocumentNode,
	FieldNode,
	FragmentDefinitionNode,
	GraphQLSchema,
	Kind,
	ObjectTypeDefinitionNode,
	OperationDefinitionNode,
	OperationTypeNode,
	parse,
	print,
	SelectionNode,
	stripIgnoredCharacters,
	TypeNode,
	UnionTypeDefinitionNode,
	validate,
	VariableDefinitionNode,
	visit,
} from 'graphql';
import { JSONSchema7 as JSONSchema } from 'json-schema';
import path from 'path';
import { EnumMapping, WG_PRETTY_GRAPHQL_VALIDATION_ERRORS, WG_THROW_ON_OPERATION_LOADING_ERROR } from '../definition';
import { wunderctlExec } from '../wunderctlexec';
import { Logger } from '../logger';
import * as fs from 'fs';
import process from 'node:process';

export interface GraphQLOperation {
	Name: string;
	PathName: string;
	Content: string;
	OperationType: OperationType;
	ExecutionEngine: OperationExecutionEngine;
	VariablesSchema: JSONSchema;
	InterpolationVariablesSchema: JSONSchema;
	InjectedVariablesSchema: JSONSchema;
	InternalVariablesSchema: JSONSchema;
	ResponseSchema: JSONSchema;
	TypeScriptOperationImport?: string;
	Mock?: {
		Endpoint: string;
		SubscriptionPollingInterval?: number;
	};
	CacheConfig?: {
		enable: boolean;
		public: boolean;
		maxAge: number;
		staleWhileRevalidate: number;
	};
	LiveQuery?: {
		enable: boolean;
		pollingIntervalSeconds: number;
	};
	AuthenticationConfig: {
		required: boolean;
	};
	AuthorizationConfig: {
		claims: ClaimConfig[];
		roleConfig: OperationRoleConfig;
	};
	HooksConfiguration: {
		preResolve: boolean;
		postResolve: boolean;
		mutatingPreResolve: boolean;
		mutatingPostResolve: boolean;
		mockResolve: {
			enable: boolean;
			subscriptionPollingIntervalMillis: number;
		};
		httpTransportOnRequest: boolean;
		httpTransportOnResponse: boolean;
		customResolve: boolean;
	};
	VariablesConfiguration: {
		injectVariables: VariableInjectionConfiguration[];
	};
	Internal: boolean;
	PostResolveTransformations?: PostResolveTransformation[];
}

type PostResolveTransformation = PostResolveGetTransformation;

export interface BasePostResolveTransformation {
	depth: number;
}

export interface PostResolveGetTransformation extends BasePostResolveTransformation {
	kind: 'get';
	get: {
		from: string[];
		to: string[];
	};
}

export interface ParsedOperations {
	operations: GraphQLOperation[];
}

export interface ParseOperationsOptions {
	keepFromClaimVariables?: boolean;
	interpolateVariableDefinitionAsJSON?: string[];
	customJsonScalars?: string[];
	customEnumMappings?: EnumMapping[];
}

const defaultParseOptions: ParseOperationsOptions = {
	keepFromClaimVariables: false,
};

const defaultVariableInjectionConfiguration: Omit<
	Omit<VariableInjectionConfiguration, 'variableKind'>,
	'variableName'
> = {
	environmentVariableName: '',
	dateFormat: '',
};

export const parseGraphQLOperations = (
	graphQLSchema: string,
	loadOperationsOutput: LoadOperationsOutput,
	options: ParseOperationsOptions = defaultParseOptions
): ParsedOperations => {
	let parsedGraphQLSchema = buildSchema(graphQLSchema);
	if (parsedGraphQLSchema.getQueryType() === undefined) {
		parsedGraphQLSchema = buildSchema(graphQLSchema + ' type Query {hello: String}');
	}
	const parsed: ParsedOperations = {
		operations: [],
	};
	const wgRoleEnum = parsedGraphQLSchema.getType('WG_ROLE')?.astNode;
	loadOperationsOutput.graphql_operation_files?.forEach((operationFile) => {
		try {
			const ast = parse(operationFile.content);
			visit(ast, {
				OperationDefinition: {
					enter: (node) => {
						const content = print(node);
						const parsedOperation = parse(content);
						const operationWithoutHooksVariables = visit(parsedOperation, {
							VariableDefinition: {
								enter: (node) => {
									if (node.directives?.some((directive) => directive.name.value === 'hooksVariable')) {
										return null;
									}
								},
							},
						});
						const errors = validate(parsedGraphQLSchema, operationWithoutHooksVariables);
						if (errors.length > 0) {
							Logger.error(`Error parsing operation ${operationFile.file_path}: ${errors.join(',')}`);
							Logger.error('Skipping operation');
							if (WG_PRETTY_GRAPHQL_VALIDATION_ERRORS) {
								console.log('\n' + errors.join(',') + '\n');
							}
							return;
						}

						const transformations: PostResolveTransformation[] = [];

						const operation: GraphQLOperation = {
							Name: operationFile.operation_name,
							PathName: operationFile.api_mount_path,
							Content: stripIgnoredCharacters(removeTransformDirectives(content)),
							OperationType: parseOperationTypeNode(node.operation),
							ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
							VariablesSchema: operationVariablesToJSONSchema(
								parsedGraphQLSchema,
								node,
								[],
								options.keepFromClaimVariables,
								false,
								options.customJsonScalars || [],
								options.customEnumMappings || []
							),
							InterpolationVariablesSchema: operationVariablesToJSONSchema(
								parsedGraphQLSchema,
								node,
								options.interpolateVariableDefinitionAsJSON || [],
								options.keepFromClaimVariables,
								false,
								options.customJsonScalars || [],
								options.customEnumMappings || []
							),
							InternalVariablesSchema: operationVariablesToJSONSchema(
								parsedGraphQLSchema,
								node,
								[],
								true,
								false,
								options.customJsonScalars || [],
								options.customEnumMappings || []
							),
							InjectedVariablesSchema: operationVariablesToJSONSchema(
								parsedGraphQLSchema,
								node,
								[],
								true,
								true,
								options.customJsonScalars || [],
								options.customEnumMappings || []
							),
							ResponseSchema: operationResponseToJSONSchema(parsedGraphQLSchema, ast, node, transformations),
							AuthenticationConfig: {
								required: false,
							},
							AuthorizationConfig: {
								claims: [],
								roleConfig: {
									requireMatchAll: [],
									requireMatchAny: [],
									denyMatchAll: [],
									denyMatchAny: [],
								},
							},
							HooksConfiguration: {
								preResolve: false,
								postResolve: false,
								mutatingPreResolve: false,
								mutatingPostResolve: false,
								mockResolve: {
									enable: false,
									subscriptionPollingIntervalMillis: 0,
								},
								httpTransportOnResponse: false,
								httpTransportOnRequest: false,
								customResolve: false,
							},
							VariablesConfiguration: {
								injectVariables: [],
							},
							Internal: false,
							PostResolveTransformations: transformations.length > 0 ? transformations : undefined,
						};
						node.variableDefinitions?.forEach((variable) => {
							handleFromClaimDirective(variable, operation);
							handleJsonSchemaDirective(variable, operation);
							handleUuidDirective(variable, operation);
							handleDateTimeDirective(variable, operation);
							handleInjectEnvironmentVariableDirective(variable, operation);
						});
						operation.Internal = node.directives?.find((d) => d.name.value === 'internalOperation') !== undefined;
						if (wgRoleEnum && wgRoleEnum.kind === 'EnumTypeDefinition') {
							const rbac = node.directives?.find((d) => d.name.value === 'rbac');
							rbac?.arguments?.forEach((arg) => {
								if (arg.value.kind !== 'ListValue') {
									return;
								}
								const values = arg.value.values
									.map((v) => {
										if (v.kind !== 'EnumValue') {
											return '';
										}
										return v.value;
									})
									.filter((v) => wgRoleEnum.values?.find((n) => n.name.value === v) !== undefined);
								switch (arg.name.value) {
									case 'requireMatchAll':
										operation.AuthorizationConfig.roleConfig.requireMatchAll = [
											...new Set([...operation.AuthorizationConfig.roleConfig.requireMatchAll, ...values]),
										];
										return;
									case 'requireMatchAny':
										operation.AuthorizationConfig.roleConfig.requireMatchAny = [
											...new Set([...operation.AuthorizationConfig.roleConfig.requireMatchAny, ...values]),
										];
										return;
									case 'denyMatchAll':
										operation.AuthorizationConfig.roleConfig.denyMatchAll = [
											...new Set([...operation.AuthorizationConfig.roleConfig.denyMatchAll, ...values]),
										];
										return;
									case 'denyMatchAny':
										operation.AuthorizationConfig.roleConfig.denyMatchAny = [
											...new Set([...operation.AuthorizationConfig.roleConfig.denyMatchAny, ...values]),
										];
										return;
								}
							});
						}
						if (
							operation.AuthorizationConfig.roleConfig.denyMatchAny.length +
								operation.AuthorizationConfig.roleConfig.denyMatchAll.length +
								operation.AuthorizationConfig.roleConfig.requireMatchAll.length +
								operation.AuthorizationConfig.roleConfig.requireMatchAny.length !==
							0
						) {
							operation.AuthenticationConfig.required = true;
						}
						if (operation.AuthorizationConfig.claims.length !== 0) {
							operation.AuthenticationConfig.required = true;
						}
						parsed.operations.push(operation);
					},
				},
			});
		} catch (e) {
			Logger.error(e);
			Logger.error(`Operations document: ${operationFile.content}`);
			Logger.error('No Operations found! Please create at least one Operation in the directory ./operations');
			Logger.error("Operation files must have the file extension '.graphql', otherwise they are ignored.");
			Logger.error("Operations don't need to be named, the file name is responsible for the operation name.");
		}
	});
	return parsed;
};

const handleJsonSchemaDirective = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const variableName = variable.variable.name.value;
	const directive = variable.directives?.find((directive) => directive.name.value === 'jsonSchema');
	if (directive === undefined || directive.arguments === undefined) {
		return;
	}
	const updateSchema = (update: (schema: JSONSchema) => void) => {
		const schema = operation.VariablesSchema.properties && operation.VariablesSchema.properties[variableName];
		if (schema !== undefined || typeof schema !== 'boolean') {
			update(schema as JSONSchema);
		}
		const schema2 =
			operation.InterpolationVariablesSchema.properties &&
			operation.InterpolationVariablesSchema.properties[variableName];
		if (schema2 !== undefined || typeof schema2 !== 'boolean') {
			update(schema2 as JSONSchema);
		}
		const schema3 =
			operation.InternalVariablesSchema.properties && operation.InternalVariablesSchema.properties[variableName];
		if (schema3 !== undefined || typeof schema3 !== 'boolean') {
			update(schema3 as JSONSchema);
		}
		const schema4 =
			operation.InjectedVariablesSchema.properties && operation.InjectedVariablesSchema.properties[variableName];
		if (schema4 !== undefined || typeof schema4 !== 'boolean') {
			update(schema4 as JSONSchema);
		}
	};
	directive.arguments.forEach((arg) => {
		switch (arg.name.value) {
			case 'title':
				updateSchema((schema) => {
					if (arg.value.kind === 'StringValue') {
						schema.title = arg.value.value;
					}
				});
				return;
			case 'description':
				updateSchema((schema) => {
					if (arg.value.kind === 'StringValue') {
						schema.description = arg.value.value;
					}
				});
				return;
			case 'multipleOf':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.multipleOf = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'maximum':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.maximum = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'exclusiveMaximum':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.exclusiveMaximum = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'minimum':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.minimum = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'exclusiveMinimum':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.exclusiveMinimum = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'maxLength':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.maxLength = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'minLength':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.minLength = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'pattern':
				updateSchema((schema) => {
					if (arg.value.kind === 'StringValue') {
						schema.pattern = arg.value.value;
					}
				});
				return;
			case 'maxItems':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.maxItems = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'minItems':
				updateSchema((schema) => {
					if (arg.value.kind === 'IntValue') {
						schema.minItems = parseInt(arg.value.value, 10);
					}
				});
				return;
			case 'uniqueItems':
				updateSchema((schema) => {
					if (arg.value.kind === 'BooleanValue') {
						schema.uniqueItems = arg.value.value;
					}
				});
				return;
			case 'commonPattern':
				updateSchema((schema) => {
					if (arg.value.kind === 'EnumValue') {
						switch (arg.value.value) {
							case 'EMAIL':
								schema.pattern =
									'(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])';
								return;
							case 'DOMAIN':
								schema.pattern = '^([a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,}$';
								return;
							case 'URL':
								schema.pattern =
									'/(((http|ftp|https):\\/{2})+(([0-9a-z_-]+\\.)+(aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mn|mn|mo|mp|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|nom|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ra|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|arpa)(:[0-9]+)?((\\/([~0-9a-zA-Z\\#\\+\\%@\\.\\/_-]+))?(\\?[0-9a-zA-Z\\+\\%@\\/&\\[\\];=_-]+)?)?))\\b/imuS\n';
								return;
						}
					}
				});
				return;
		}
	});
};

const handleFromClaimDirective = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const variableName = variable.variable.name.value;
	const fromClaimDirective = variable.directives?.find((directive) => directive.name.value === 'fromClaim');
	if (fromClaimDirective === undefined || fromClaimDirective.arguments === undefined) {
		return;
	}
	const nameArg = fromClaimDirective.arguments.find((arg) => arg.name.value === 'name');
	if (nameArg === undefined) {
		return;
	}
	if (nameArg.value.kind !== 'EnumValue') {
		return;
	}
	const name = nameArg.value.value;
	switch (name) {
		case 'USERID':
			operation.AuthenticationConfig.required = true;
			operation.AuthorizationConfig.claims.push({
				variableName,
				claim: Claim.USERID,
			});
			break;
		case 'EMAIL':
			operation.AuthenticationConfig.required = true;
			operation.AuthorizationConfig.claims.push({
				variableName,
				claim: Claim.EMAIL,
			});
			break;
		case 'EMAIL_VERIFIED':
			operation.AuthenticationConfig.required = true;
			operation.AuthorizationConfig.claims.push({
				variableName,
				claim: Claim.EMAIL_VERIFIED,
			});
			break;
		case 'NAME':
			operation.AuthenticationConfig.required = true;
			operation.AuthorizationConfig.claims.push({
				variableName,
				claim: Claim.NAME,
			});
			break;
		case 'NICKNAME':
			operation.AuthenticationConfig.required = true;
			operation.AuthorizationConfig.claims.push({
				variableName,
				claim: Claim.NICKNAME,
			});
			break;
		case 'LOCATION':
			operation.AuthenticationConfig.required = true;
			operation.AuthorizationConfig.claims.push({
				variableName,
				claim: Claim.LOCATION,
			});
			break;
		case 'PROVIDER':
			operation.AuthenticationConfig.required = true;
			operation.AuthorizationConfig.claims.push({
				variableName,
				claim: Claim.PROVIDER,
			});
			break;
	}
};

const handleInjectEnvironmentVariableDirective = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const variableName = variable.variable.name.value;
	const directive = variable.directives?.find((directive) => directive.name.value === 'injectEnvironmentVariable');
	if (directive === undefined) {
		return;
	}
	const arg = directive.arguments?.find((arg) => arg.name.value === 'name');
	if (arg === undefined || arg.value.kind !== Kind.STRING) {
		return;
	}
	operation.VariablesConfiguration.injectVariables.push({
		...defaultVariableInjectionConfiguration,
		variableName,
		variableKind: InjectVariableKind.ENVIRONMENT_VARIABLE,
		environmentVariableName: arg.value.value,
	});
};

const handleUuidDirective = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const variableName = variable.variable.name.value;
	const directive = variable.directives?.find((directive) => directive.name.value === 'injectGeneratedUUID');
	if (directive === undefined) {
		return;
	}
	operation.VariablesConfiguration.injectVariables.push({
		...defaultVariableInjectionConfiguration,
		variableName,
		variableKind: InjectVariableKind.UUID,
	});
};

const handleDateTimeDirective = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const variableName = variable.variable.name.value;
	const directive = variable.directives?.find((directive) => directive.name.value === 'injectCurrentDateTime');
	if (directive === undefined) {
		return;
	}
	const formatArg = directive.arguments?.find((arg) => arg.name.value === 'format');
	if (formatArg !== undefined && formatArg.value.kind === 'EnumValue') {
		const format = formatArg.value.value;
		switch (format) {
			case 'ISO8601':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: '2006-01-02T15:04:05Z07:00',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'ANSIC':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Mon Jan _2 15:04:05 2006',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'UnixDate':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Mon Jan _2 15:04:05 MST 2006',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RubyDate':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Mon Jan 02 15:04:05 -0700 2006',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RFC822':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: '02 Jan 06 15:04 MST',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RFC822Z':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: '02 Jan 06 15:04 -0700',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RFC850':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Monday, 02-Jan-06 15:04:05 MST',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RFC1123':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Mon, 02 Jan 2006 15:04:05 MST',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RFC1123Z':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Mon, 02 Jan 2006 15:04:05 -0700',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RFC3339':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: '2006-01-02T15:04:05Z07:00',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'RFC3339Nano':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: '2006-01-02T15:04:05.999999999Z07:00',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'Kitchen':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: '3:04PM',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'Stamp':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Jan _2 15:04:05',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'StampMilli':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Jan _2 15:04:05.000',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'StampMicro':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Jan _2 15:04:05.000000',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
			case 'StampNano':
				operation.VariablesConfiguration.injectVariables.push({
					...defaultVariableInjectionConfiguration,
					variableName,
					dateFormat: 'Jan _2 15:04:05.000000000',
					variableKind: InjectVariableKind.DATE_TIME,
				});
				return;
		}
	}
	const customFormatArg = directive.arguments?.find((arg) => arg.name.value === 'customFormat');
	if (customFormatArg !== undefined && customFormatArg.value.kind === 'StringValue') {
		operation.VariablesConfiguration.injectVariables.push({
			...defaultVariableInjectionConfiguration,
			variableName,
			dateFormat: customFormatArg.value.value,
			variableKind: InjectVariableKind.DATE_TIME,
		});
		return;
	}
	operation.VariablesConfiguration.injectVariables.push({
		...defaultVariableInjectionConfiguration,
		variableName,
		dateFormat: '2006-01-02T15:04:05Z07:00',
		variableKind: InjectVariableKind.DATE_TIME,
	});
};

const parseOperationTypeNode = (node: OperationTypeNode): OperationType => {
	switch (node) {
		case 'subscription':
			return OperationType.SUBSCRIPTION;
		case 'mutation':
			return OperationType.MUTATION;
		case 'query':
			return OperationType.QUERY;
		default:
			return -1;
	}
};

export const operationVariablesToJSONSchema = (
	graphQLSchema: GraphQLSchema,
	operation: OperationDefinitionNode,
	interpolateVariableDefinitionAsJSON: string[],
	keepInternalVariables: boolean = false,
	keepInjectedVariables: boolean = false,
	customJsonScalars: string[],
	customEnumMappings: EnumMapping[]
): JSONSchema => {
	const schema: JSONSchema = {
		type: 'object',
		properties: {},
		additionalProperties: false,
		definitions: {},
	};

	if (!operation.variableDefinitions) {
		return schema;
	}

	operation.variableDefinitions.forEach((variable) => {
		if (!keepInternalVariables && hasInternalVariable(variable)) {
			return;
		}
		if (!keepInjectedVariables && hasInjectedVariable(variable)) {
			return;
		}
		let type = variable.type;
		let nonNullType = false;
		if (type.kind === 'NonNullType' && variable.defaultValue !== undefined) {
			type = type.type;
			nonNullType = true;
		}
		const name = variable.variable.name.value;
		schema.properties![name] = typeSchema(
			schema,
			schema,
			graphQLSchema,
			interpolateVariableDefinitionAsJSON,
			type,
			name,
			nonNullType,
			customJsonScalars,
			customEnumMappings
		);
	});

	return schema;
};

const internalVariables = [
	'fromClaim',
	'internal',
	'injectGeneratedUUID',
	'injectCurrentDateTime',
	'injectEnvironmentVariable',
];

const injectedVariables = ['injectGeneratedUUID', 'injectCurrentDateTime', 'injectEnvironmentVariable'];

const hasInternalVariable = (variable: VariableDefinitionNode): boolean => {
	return (
		variable.directives?.find(
			(directive) => internalVariables.find((i) => i === directive.name.value) !== undefined
		) !== undefined
	);
};

const hasInjectedVariable = (variable: VariableDefinitionNode): boolean => {
	return (
		variable.directives?.find(
			(directive) => injectedVariables.find((i) => i === directive.name.value) !== undefined
		) !== undefined
	);
};

const typeSchema = (
	root: JSONSchema,
	parent: JSONSchema,
	graphQLSchema: GraphQLSchema,
	interpolateVariableDefinitionAsJSON: string[],
	type: TypeNode,
	name: string,
	nonNull: boolean,
	customJsonScalars: string[],
	customEnumMappings: EnumMapping[]
): JSONSchema => {
	switch (type.kind) {
		case 'NonNullType':
			switch (parent.type) {
				case 'object':
					parent.required = [...(parent.required || []), name];
					break;
				case 'array':
					parent.minItems = 1;
					break;
			}
			return typeSchema(
				root,
				parent,
				graphQLSchema,
				interpolateVariableDefinitionAsJSON,
				type.type,
				name,
				true,
				customJsonScalars,
				customEnumMappings
			);
		case 'ListType':
			const schema: JSONSchema = {
				type: nonNull ? 'array' : ['array', 'null'],
			};
			schema.items = typeSchema(
				root,
				schema,
				graphQLSchema,
				interpolateVariableDefinitionAsJSON,
				type.type,
				name,
				false,
				customJsonScalars,
				customEnumMappings
			);
			return schema;
		case 'NamedType':
			switch (type.name.value) {
				case 'Int':
					return {
						type: nonNull ? 'integer' : ['integer', 'null'],
					};
				case 'Boolean':
					return {
						type: nonNull ? 'boolean' : ['boolean', 'null'],
					};
				case 'ID':
					return {
						type: nonNull ? 'string' : ['string', 'null'],
					};
				case 'Float':
					return {
						type: nonNull ? 'number' : ['number', 'null'],
					};
				case 'String':
					return {
						type: nonNull ? 'string' : ['string', 'null'],
					};
				case 'JSON':
					return {};
				default:
					if (customJsonScalars.includes(type.name.value)) {
						return {};
					}

					let schema: JSONSchema = {};
					const namedType = graphQLSchema.getType(type.name.value);
					if (namedType === null || namedType === undefined || !namedType.astNode) {
						return {};
					}
					if (interpolateVariableDefinitionAsJSON.length) {
						if (interpolateVariableDefinitionAsJSON.includes(namedType.name)) {
							return {}; // return empty JSON Schema (treated as JSON:any)
						}
					}
					switch (namedType.astNode.kind) {
						case 'ScalarTypeDefinition':
							const match = customEnumMappings.find((item) => item.normalisedName === namedType.name);
							if (!match) {
								return {
									type: nonNull ? 'string' : ['string', 'null'],
								};
							}
							return {
								type: nonNull ? 'string' : ['string', 'null'],
								enum: match.values,
							};
						case 'EnumTypeDefinition':
							schema.type = nonNull ? 'string' : ['string', 'null'];
							schema.enum = (namedType.astNode.values || []).map((e) => {
								return e.name.value;
							});
							break;
						case 'InputObjectTypeDefinition':
							const typeName = namedType.name;
							if (Object.keys(root.definitions!).includes(typeName)) {
								return {
									$ref: '#/definitions/' + typeName,
								};
							}
							root.definitions![typeName] = {
								type: nonNull ? 'object' : ['object', 'null'],
							};
							schema.additionalProperties = false;
							schema.type = nonNull ? 'object' : ['object', 'null'];
							schema.properties = {};
							(namedType.astNode.fields || []).forEach((f) => {
								const name = f.name.value;
								let fieldType = f.type;
								if (f.defaultValue !== undefined && fieldType.kind === 'NonNullType') {
									fieldType = fieldType.type;
								}
								schema.properties![name] = typeSchema(
									root,
									schema,
									graphQLSchema,
									interpolateVariableDefinitionAsJSON,
									fieldType,
									name,
									false,
									customJsonScalars,
									customEnumMappings
								);
							});
							root.definitions![typeName] = schema;
							return {
								$ref: '#/definitions/' + typeName,
							};
					}
					return schema;
			}
	}
	return {};
};

export const operationResponseToJSONSchema = (
	graphQLSchema: GraphQLSchema,
	operationDocument: DocumentNode,
	operationNode: OperationDefinitionNode,
	transformations: PostResolveTransformation[]
): JSONSchema => {
	const dataSchema: JSONSchema = {
		type: 'object',
		properties: {},
		additionalProperties: false,
	};
	const schema: JSONSchema = {
		type: 'object',
		properties: {
			data: dataSchema,
		},
		additionalProperties: false,
	};
	const typeName = operationRootTypeName(operationNode, graphQLSchema);
	resolveSelections(
		graphQLSchema,
		operationDocument,
		operationNode.selectionSet.selections,
		typeName,
		dataSchema,
		['data'],
		transformations
	);
	return schema;
};

const operationRootTypeName = (node: OperationDefinitionNode, graphQLSchema: GraphQLSchema): string => {
	switch (node.operation) {
		case 'query':
			return (graphQLSchema.getQueryType() || {}).name || '';
		case 'mutation':
			return (graphQLSchema.getMutationType() || {}).name || '';
		case 'subscription':
			return (graphQLSchema.getSubscriptionType() || {}).name || '';
		default:
			return '';
	}
};

const resolveSelections = (
	graphQLSchema: GraphQLSchema,
	operationDocument: DocumentNode,
	selections: ReadonlyArray<SelectionNode>,
	parentTypeName: string,
	parentObject: JSONSchema,
	documentPath: string[],
	transformations: PostResolveTransformation[]
) => {
	const parentType = graphQLSchema.getType(parentTypeName);
	if (!parentType || !parentType.astNode) {
		return;
	}
	if (parentType.astNode.kind === 'UnionTypeDefinition') {
		selections.forEach((selection) => {
			switch (selection.kind) {
				case 'Field':
					const fieldName = selection.name.value;
					const propName = selection.alias !== undefined ? selection.alias.value : selection.name.value;
					if (fieldName !== '__typename') {
						return;
					}
					parentObject.properties![propName] = {
						type: 'string',
						enum: ((parentType!.astNode as UnionTypeDefinitionNode).types || []).map((t) => t.name.value),
					};
					if (parentObject.required) {
						parentObject.required.push(propName);
					} else {
						parentObject.required = [propName];
					}
					return;
				case 'InlineFragment':
					if (!selection.typeCondition) {
						return;
					}
					const typeName = selection.typeCondition.name.value;
					resolveSelections(
						graphQLSchema,
						operationDocument,
						selection.selectionSet.selections,
						typeName,
						parentObject,
						documentPath,
						transformations
					);
					delete parentObject.required; // union root fields are always optional
					return;
				case 'FragmentSpread':
					const fragmentDefinition = operationDocument.definitions.find(
						(node) => node.kind === 'FragmentDefinition' && node.name.value === selection.name.value
					);
					if (fragmentDefinition) {
						const typeName = (fragmentDefinition as FragmentDefinitionNode).typeCondition.name.value;
						const selections = (fragmentDefinition as FragmentDefinitionNode).selectionSet.selections;
						resolveSelections(
							graphQLSchema,
							operationDocument,
							selections,
							typeName,
							parentObject,
							documentPath,
							transformations
						);
						delete parentObject.required; // union root fields are always optional
						return;
					}
			}
		});
		return;
	}
	if (
		(parentType.astNode.kind !== 'ObjectTypeDefinition' && parentType.astNode.kind !== 'InterfaceTypeDefinition') ||
		!parentType.astNode.fields
	) {
		return;
	}
	selections.forEach((selection) => {
		switch (selection.kind) {
			case 'Field':
				const fieldName = selection.name.value;
				const propName = selection.alias !== undefined ? selection.alias.value : selection.name.value;
				if (fieldName === '__typename') {
					if (
						parentObject.properties![propName] !== undefined &&
						(parentObject.properties![propName] as JSONSchema).enum !== undefined
					) {
						(parentObject.properties![propName] as JSONSchema).enum!.push(parentTypeName);
					} else {
						parentObject.properties![propName] = {
							type: 'string',
							enum: [parentTypeName],
						};
						if (parentObject.required) {
							parentObject.required.push(propName);
						} else {
							parentObject.required = [propName];
						}
					}
					return;
				}
				const definition = (parentType.astNode as ObjectTypeDefinitionNode).fields!.find(
					(f) => f.name.value === fieldName
				);
				if (!definition) {
					return;
				}

				let schema = resolveFieldSchema(
					graphQLSchema,
					operationDocument,
					propName,
					selection,
					definition.type,
					parentObject,
					[...documentPath, propName],
					transformations
				);

				const transformDirective = selection.directives?.find((d) => d.name.value === 'transform');
				if (transformDirective) {
					schema = handleTransformDirective(transformDirective, schema, [...documentPath, propName], transformations);
				}

				parentObject.properties![propName] = schema;
				break;
			case 'FragmentSpread':
				const fragmentDefinition = operationDocument.definitions.find(
					(node) => node.kind === 'FragmentDefinition' && node.name.value === selection.name.value
				) as FragmentDefinitionNode;
				resolveSelections(
					graphQLSchema,
					operationDocument,
					fragmentDefinition.selectionSet.selections,
					parentTypeName,
					parentObject,
					documentPath,
					transformations
				);
				break;
			case 'InlineFragment':
				resolveSelections(
					graphQLSchema,
					operationDocument,
					selection.selectionSet.selections,
					parentTypeName,
					parentObject,
					documentPath,
					transformations
				);
				break;
		}
	});
};

const resolveFieldSchema = (
	graphQLSchema: GraphQLSchema,
	operationDocument: DocumentNode,
	propName: string,
	field: FieldNode,
	fieldType: TypeNode,
	parent: JSONSchema,
	documentPath: string[],
	transformations: PostResolveTransformation[]
): JSONSchema => {
	switch (fieldType.kind) {
		case 'NonNullType':
			switch (parent.type) {
				case 'object':
					parent.required = [...new Set([...(parent.required || []), propName])];
					return resolveFieldSchema(
						graphQLSchema,
						operationDocument,
						propName,
						field,
						fieldType.type,
						parent,
						documentPath,
						transformations
					);
				case 'array':
					parent.minItems = 1;
					return resolveFieldSchema(
						graphQLSchema,
						operationDocument,
						propName,
						field,
						fieldType.type,
						parent,
						documentPath,
						transformations
					);
				default:
					return {};
			}
		case 'ListType':
			return {
				type: 'array',
				items: resolveFieldSchema(
					graphQLSchema,
					operationDocument,
					propName,
					field,
					fieldType.type,
					parent,
					[...documentPath, '[]'],
					transformations
				),
			};
		case 'NamedType':
			switch (fieldType.name.value) {
				case 'Int':
					return {
						type: 'integer',
					};
				case 'Boolean':
					return {
						type: 'boolean',
					};
				case 'ID':
					return {
						type: 'string',
					};
				case 'Float':
					return {
						type: 'number',
					};
				case 'String':
					return {
						type: 'string',
					};
				case 'JSON':
					return {};
				default:
					let schema: JSONSchema = {};
					const namedType = graphQLSchema.getType(fieldType.name.value);
					if (namedType === null || namedType === undefined || !namedType.astNode) {
						return {};
					}
					switch (namedType.astNode.kind) {
						case 'ScalarTypeDefinition':
							return {
								type: 'string',
							};
						case 'EnumTypeDefinition':
							schema.type = 'string';
							schema.enum = (namedType.astNode.values || []).map((e) => {
								return e.name.value;
							});
							break;
						case 'UnionTypeDefinition':
						case 'InterfaceTypeDefinition':
						case 'ObjectTypeDefinition':
							schema.type = 'object';
							schema.properties = {};
							schema.additionalProperties = false;
							if (!field.selectionSet) {
								return schema;
							}
							resolveSelections(
								graphQLSchema,
								operationDocument,
								field.selectionSet.selections,
								namedType.name,
								schema,
								documentPath,
								transformations
							);
							break;
					}
					return schema;
			}
	}
	return {};
};

const handleTransformDirective = (
	transformDirective: DirectiveNode,
	schema: JSONSchema,
	documentPath: string[],
	transformations: PostResolveTransformation[]
): JSONSchema => {
	const get = transformDirective.arguments?.find((arg) => arg.name.value === 'get');
	if (get && get.value.kind === 'StringValue') {
		const path = get.value.value.split('.');
		const outPath: string[] = [];
		let updatedSchema = Object.assign({}, schema);
		let valid = true;
		path.forEach((elem) => {
			if (elem === '[]' && updatedSchema.items) {
				outPath.push('[]');
				// @ts-ignore
				updatedSchema = updatedSchema.items;
				return;
			}
			if (updatedSchema.items) {
				// unwrap array so that we can get to the property
				outPath.push('[]');
				// @ts-ignore
				updatedSchema = updatedSchema.items;
			}
			if (updatedSchema.properties) {
				outPath.push(elem);
				// @ts-ignore
				updatedSchema = updatedSchema.properties[elem];
				return;
			}
			valid = false;
		});
		if (valid) {
			const from = [...documentPath, ...outPath];
			transformations.push({
				kind: 'get',
				depth: from.length,
				get: {
					from: from,
					to: documentPath,
				},
			});
			return updatedSchema;
		} else {
			throw new Error(`Invalid path for get transformation: ${get.value.value}, schema: ${JSON.stringify(schema)}`);
		}
	}
	return schema;
};

export interface LoadOperationsOutput {
	graphql_operation_files?: GraphQLOperationFile[];
	typescript_operation_files?: TypeScriptOperationFile[];
	invalid?: string[];
	errors?: string[];
	info?: string[];
}

export interface GraphQLOperationFile {
	operation_name: string;
	api_mount_path: string;
	file_path: string;
	content: string;
}

export interface TypeScriptOperationFile {
	operation_name: string;
	api_mount_path: string;
	file_path: string;
	module_path: string;
}

export const loadOperations = (schemaFileName: string): LoadOperationsOutput => {
	const operationsPath = path.join(process.env.WG_DIR_ABS!, 'operations');
	const fragmentsPath = path.join(process.env.WG_DIR_ABS!, 'fragments');
	const schemaFilePath = path.join(process.env.WG_DIR_ABS!, 'generated', schemaFileName);
	const outFilePath = path.join(process.env.WG_DIR_ABS!, 'generated', 'wundergraph.operations.json');
	const result = wunderctlExec({
		cmd: ['loadoperations', operationsPath, fragmentsPath, schemaFilePath, '--pretty'],
	});
	if (result?.failed) {
		throw new Error(result?.stderr);
	}

	const output = fs.readFileSync(outFilePath, 'utf8');
	const out = JSON.parse(output) as LoadOperationsOutput;

	out.info?.forEach((msg) => Logger.info(msg));
	out.errors?.forEach((msg) => Logger.error(msg));

	if (WG_THROW_ON_OPERATION_LOADING_ERROR && (out.errors?.length ?? 0) > 0 && out?.errors?.[0]) {
		throw new Error(out.errors[0]);
	}

	return out;
};

export const removeHookVariables = (operation: string): string => {
	if (operation === '') {
		return operation;
	}
	const document = parse(operation);
	const updated = visit(document, {
		VariableDefinition: (node) => {
			const isHooksVariable = node.directives?.find((d) => d.name.value === 'hooksVariable') !== undefined;
			if (isHooksVariable) {
				return null;
			}
			return node;
		},
	});
	return print(updated);
};

export const removeTransformDirectives = (operation: string): string => {
	const document = parse(operation);
	const updated = visit(document, {
		Directive: (node) => {
			if (node.name.value === 'transform') {
				return null;
			}
		},
	});
	return print(updated);
};
