import {
	ClaimConfig,
	ClaimType,
	CustomClaim,
	InjectVariableKind,
	OperationExecutionEngine,
	OperationRoleConfig,
	OperationType,
	VariableInjectionConfiguration,
} from '@wundergraph/protobuf';
import {
	BREAK,
	buildSchema,
	ConstArgumentNode,
	ConstDirectiveNode,
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
import { WG_PRETTY_GRAPHQL_VALIDATION_ERRORS } from '../definition';
import { wunderctl } from '../wunderctlexec';
import { Logger } from '../logger';
import * as fs from 'fs';
import process from 'node:process';
import { OperationError } from '../client';
import { QueryCacheConfiguration } from '../operations';
import { getDirectives } from '@graphql-tools/utils';

export const isInternalOperationByAPIMountPath = (path: string) => {
	// Split the file path by the path separator
	// The api mount path is always in UNIX style
	const elements = path.split('/');

	// Remove the last element (the file name)
	elements.pop();

	// check if the resulting array contains internal
	return elements.includes('internal');
};

export interface GraphQLOperation {
	Name: string;
	Description: string;
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
	/***
	 * Cache configuration for operations. If not specified, it defaults
	 * to "public, max-age=0, must-revalidate", overriding public with private
	 * in authenticated operations.
	 */
	CacheConfig?: QueryCacheConfiguration;
	LiveQuery?: {
		enable: boolean;
		pollingIntervalSeconds: number;
	};
	AuthenticationConfig?: {
		required?: boolean;
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

export interface TypeScriptOperation extends GraphQLOperation {
	Errors?: OperationError[];
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
	customJsonScalars?: Set<string>;
	customClaims?: Record<string, CustomClaim>;
	wgDirAbs?: string;
}

const defaultParseOptions: ParseOperationsOptions = {
	keepFromClaimVariables: false,
	wgDirAbs: '',
};

const defaultVariableInjectionConfiguration: Omit<
	Omit<VariableInjectionConfiguration, 'variableKind'>,
	'variablePathComponents'
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
	const customJsonScalars = options.customJsonScalars ?? new Set<string>();
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
							Description: loadOperationDescription(operationFile, options.wgDirAbs),
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
								customJsonScalars
							),
							InterpolationVariablesSchema: operationVariablesToJSONSchema(
								parsedGraphQLSchema,
								node,
								options.interpolateVariableDefinitionAsJSON || [],
								options.keepFromClaimVariables,
								false,
								customJsonScalars
							),
							InternalVariablesSchema: operationVariablesToJSONSchema(
								parsedGraphQLSchema,
								node,
								[],
								true,
								false,
								customJsonScalars
							),
							InjectedVariablesSchema: operationVariablesToJSONSchema(
								parsedGraphQLSchema,
								node,
								[],
								true,
								true,
								customJsonScalars
							),
							ResponseSchema: operationResponseToJSONSchema(
								parsedGraphQLSchema,
								ast,
								node,
								transformations,
								customJsonScalars
							),
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
							handleFromClaimDirectives(variable, operation, options.customClaims ?? {});
							handleJsonSchemaDirectives(variable, operation);
							handleUuidDirectives(variable, operation);
							handleDateTimeDirectives(variable, operation);
							handleInjectEnvironmentVariableDirectives(variable, operation);
						});

						const internalOperationDirective =
							node.directives?.find((d) => d.name.value === 'internalOperation') !== undefined;
						if (internalOperationDirective) {
							Logger.warn(
								'Use of internalOperation directive is deprecated. ' +
									'More details here: https://docs.wundergraph.com/docs/directives-reference/internal-operation-directive'
							);
						}
						operation.Internal =
							internalOperationDirective || isInternalOperationByAPIMountPath(operationFile.api_mount_path);

						if (node.directives?.find((d) => d.name.value === 'requireAuthentication') !== undefined) {
							operation.AuthenticationConfig = {
								...operation.AuthenticationConfig,
								required: true,
							};
						}

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
							operation.AuthenticationConfig = {
								...operation.AuthenticationConfig,
								required: true,
							};
						}
						if (operation.AuthorizationConfig.claims.length !== 0) {
							operation.AuthenticationConfig = {
								...operation.AuthenticationConfig,
								required: true,
							};
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

const jsonSchemaUpdater = (arg: ConstArgumentNode) => {
	const schemaProperties: Record<string, 'string' | 'int' | 'bool'> = {
		title: 'string',
		description: 'string',
		multipleOf: 'int',
		maximum: 'int',
		exclusiveMaximum: 'int',
		minimum: 'int',
		exclusiveMinimum: 'int',
		maxLength: 'int',
		minLength: 'int',
		pattern: 'string',
		maxItems: 'int',
		minItems: 'int',
		uniqueItems: 'bool',
	};

	const propName = arg.name.value;
	if (propName === 'on') {
		// Used to set the field
		return;
	}
	if (propName === 'commonPattern') {
		if (arg.value.kind !== 'EnumValue') {
			throw new Error(`commonPattern must be an enum, not ${arg.value.kind}`);
		}
		let pattern: string;
		switch (arg.value.value) {
			case 'EMAIL':
				pattern =
					'(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])';
				break;
			case 'DOMAIN':
				pattern = '^([a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,}$';
				break;
			case 'URL':
				pattern =
					'/(((http|ftp|https):\\/{2})+(([0-9a-z_-]+\\.)+(aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mn|mn|mo|mp|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|nom|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ra|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|arpa)(:[0-9]+)?((\\/([~0-9a-zA-Z\\#\\+\\%@\\.\\/_-]+))?(\\?[0-9a-zA-Z\\+\\%@\\/&\\[\\];=_-]+)?)?))\\b/imuS\n';
				break;
			default:
				throw new Error(`unhandled common pattern ${arg.value.value}`);
		}
		return (schema: JSONSchema) => {
			if (schema.pattern) {
				throw new Error(`pattern is already set`);
			}
			schema.pattern = pattern;
		};
	}
	const propType = schemaProperties[propName];
	if (!propType) {
		throw new Error(`unknown JSON schema property ${propName}`);
	}
	let value: any;
	switch (propType) {
		case 'string':
			if (arg.value.kind !== Kind.STRING) {
				throw new Error(`${propName} must be a string, not ${arg.value.kind}`);
			}
			value = arg.value.value;
			break;
		case 'int':
			if (arg.value.kind !== Kind.INT) {
				throw new Error(`${propName} must be an int, not ${arg.value.kind}`);
			}
			value = parseInt(arg.value.value, 10);
			break;
		case 'bool':
			if (arg.value.kind !== Kind.BOOLEAN) {
				throw new Error(`${propName} must be a boolean, not ${arg.value.kind}`);
			}
			value = arg.value.value;
			break;
	}
	return (schema: JSONSchema) => {
		if ((schema as any)[propName]) {
			throw new Error(`${propName} is already set`);
		}
		(schema as any)[propName] = value;
	};
};

const loadOperationDescription = (operationFile: GraphQLOperationFile, wgDirAbs?: string): string => {
	if (!wgDirAbs) {
		return '';
	}
	const operationFileContentPath = path.join(wgDirAbs, 'operations', operationFile.file_path);
	const operationFileContent = fs.readFileSync(operationFileContentPath, 'utf-8');
	return extractOperationDescription(operationFileContent);
};

const handleJsonSchemaDirectives = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const directiveName = 'jsonSchema';
	const updateJSONSchema = (
		schema: JSONSchema,
		variablePathComponents: string[],
		update: (schema: JSONSchema) => void
	) => {
		let prop = JSONSchemaPropertyResolvingRef(schema, schema, variablePathComponents[0]);
		for (const component of variablePathComponents.slice(1, variablePathComponents.length)) {
			prop = JSONSchemaPropertyResolvingRef(schema, prop, component);
		}
		update(prop);
	};
	const updateSchema = (variablePathComponents: string[], update: (schema: JSONSchema) => void) => {
		updateJSONSchema(operation.VariablesSchema, variablePathComponents, update);
		updateJSONSchema(operation.InterpolationVariablesSchema, variablePathComponents, update);
		updateJSONSchema(operation.InternalVariablesSchema, variablePathComponents, update);
		updateJSONSchema(operation.InjectedVariablesSchema, variablePathComponents, update);
	};
	directivesNamed(variable, directiveName).forEach((directive) => {
		directive.arguments?.forEach((arg) => {
			const variablePathComponents = directiveInjectedVariablePathComponents(directive, variable, operation);
			try {
				const updater = jsonSchemaUpdater(arg);
				if (updater) {
					updateSchema(variablePathComponents, updater);
				}
			} catch (e: any) {
				const variablePathComponents = directiveInjectedVariablePathComponents(directive, variable, operation);
				throw new Error(
					`invalid @${directiveName} directive on ${variablePathComponents.join('.')} in operation ${
						operation.Name
					}: ${e}`
				);
			}
		});
	});
};

// XXX: Keep this in sync with User in authentication.go
const wgClaimToTypescriptField = {
	ISSUER: 'providerId',
	PROVIDER: 'providerId',
	SUBJECT: 'userId',
	USERID: 'userId',
	NAME: 'name',
	GIVEN_NAME: 'firstName',
	FAMILY_NAME: 'lastName',
	MIDDLE_NAME: 'middleName',
	NICKNAME: 'nickName',
	PREFERRED_USERNAME: 'preferredUsername',
	PROFILE: 'profile',
	PICTURE: 'picture',
	WEBSITE: 'website',
	EMAIL: 'email',
	EMAIL_VERIFIED: 'emailVerified',
	GENDER: 'gender',
	BIRTH_DATE: 'birthDate',
	ZONE_INFO: 'zoneInfo',
	LOCALE: 'locale',
	LOCATION: 'location',
} as const;

export const WellKnownClaimValues = Object.keys(wgClaimToTypescriptField);

export type WellKnownClaim = keyof typeof wgClaimToTypescriptField;

const parseWellKnownClaim = (name: string) => {
	const claims: Record<WellKnownClaim, ClaimType> = {
		ISSUER: ClaimType.ISSUER,
		PROVIDER: ClaimType.PROVIDER,
		SUBJECT: ClaimType.SUBJECT,
		USERID: ClaimType.USERID,
		NAME: ClaimType.NAME,
		GIVEN_NAME: ClaimType.GIVEN_NAME,
		FAMILY_NAME: ClaimType.FAMILY_NAME,
		MIDDLE_NAME: ClaimType.MIDDLE_NAME,
		NICKNAME: ClaimType.NICKNAME,
		PREFERRED_USERNAME: ClaimType.PREFERRED_USERNAME,
		PROFILE: ClaimType.PROFILE,
		PICTURE: ClaimType.PICTURE,
		WEBSITE: ClaimType.WEBSITE,
		EMAIL: ClaimType.EMAIL,
		EMAIL_VERIFIED: ClaimType.EMAIL_VERIFIED,
		GENDER: ClaimType.GENDER,
		BIRTH_DATE: ClaimType.BIRTH_DATE,
		ZONE_INFO: ClaimType.ZONE_INFO,
		LOCALE: ClaimType.LOCALE,
		LOCATION: ClaimType.LOCATION,
	};
	if (Object.keys(claims).length !== WellKnownClaimValues.length) {
		throw new Error('unhandled claims in parseWellKnownClaim()');
	}
	if (name in claims) {
		return claims[name as WellKnownClaim];
	}
	throw new Error(`unhandled claim ${name}`);
};

/**
 * Returns true iff name is a well known claim
 *
 * @param name Claim name as in WellKnownClaim
 */
export const isWellKnownClaim = (name: string) => {
	return name in wgClaimToTypescriptField;
};

export const wellKnownClaimField = (name: string) => {
	if (name in wgClaimToTypescriptField) {
		return wgClaimToTypescriptField[name as WellKnownClaim];
	}
	throw new Error(`unhandled claim ${name}`);
};

const directiveInjectedVariablePathComponents = (
	directive: ConstDirectiveNode,
	variable: VariableDefinitionNode,
	operation: GraphQLOperation
): string[] => {
	const onArg = directive.arguments?.find((arg) => arg.name.value === 'on');
	const variableName = variable.variable.name.value;
	let variablePathComponents: string[];
	if (onArg) {
		if (onArg.value.kind !== Kind.STRING) {
			throw new Error(
				`@${directive.name.value} on: argument in operation ${operation.Name} (${variableName}) must be a String, not ${onArg.value.kind}`
			);
		}
		variablePathComponents = [variableName, ...onArg.value.value.split('.')];
	} else {
		variablePathComponents = [variableName];
	}
	try {
		JSONSchemaLookupPath(operation.InjectedVariablesSchema, variablePathComponents);
	} catch (e: any) {
		throw new Error(
			`could not resolve on: attribute in @${directive.name.value} (${variablePathComponents.join('.')}) in operation ${
				operation.Name
			}: ${e}`
		);
	}
	return variablePathComponents;
};

const handleFromClaimDirective = (
	fromClaimDirective: ConstDirectiveNode,
	variable: VariableDefinitionNode,
	operation: GraphQLOperation,
	customClaims: Record<string, CustomClaim>
) => {
	if (fromClaimDirective.arguments === undefined) {
		throw new Error(`@fromClaim directive on operation ${operation.Name} has no arguments`);
	}
	const nameArg = fromClaimDirective.arguments.find((arg) => arg.name.value === 'name');
	if (nameArg === undefined) {
		throw new Error(`@fromClaim on operation ${operation.Name} does not have a name: argument`);
	}
	if (nameArg.value.kind !== Kind.ENUM) {
		throw new Error(
			`@fromClaim name: argument on operation ${operation.Name} must be a WG_CLAIM, not ${nameArg.value.kind}`
		);
	}
	let variablePathComponents = directiveInjectedVariablePathComponents(fromClaimDirective, variable, operation);
	const claimName = nameArg.value.value;
	let claim: ClaimConfig;
	if (claimName in customClaims) {
		const customClaim = customClaims[claimName];
		claim = {
			variablePathComponents,
			claimType: ClaimType.CUSTOM,
			custom: {
				name: claimName,
				jsonPathComponents: customClaim.jsonPathComponents,
				type: customClaim.type,
				required: customClaim.required,
			},
		};
	} else {
		claim = {
			variablePathComponents,
			claimType: parseWellKnownClaim(claimName),
		};
	}
	operation.AuthenticationConfig = {
		...operation.AuthenticationConfig,
		required: true,
	};
	operation.AuthorizationConfig.claims.push(claim);
};

const handleFromClaimDirectives = (
	variable: VariableDefinitionNode,
	operation: GraphQLOperation,
	customClaims: Record<string, CustomClaim>
) => {
	directivesNamed(variable, 'fromClaim').forEach((directive) => {
		handleFromClaimDirective(directive, variable, operation, customClaims);
	});
};

const handleInjectEnvironmentVariableDirectives = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const directiveName = 'injectEnvironmentVariable';
	directivesNamed(variable, directiveName).forEach((directive) => {
		const arg = directive.arguments?.find((arg) => arg.name.value === 'name');
		if (!arg) {
			throw new Error(`name: argument missing in @${directiveName} in operation ${operation.Name}`);
		}
		if (arg.value.kind !== Kind.STRING) {
			throw new Error(
				`name: argument in @${directiveName} in operation ${operation.Name} must be string, not ${arg.value.kind}`
			);
		}
		let variablePathComponents = directiveInjectedVariablePathComponents(directive, variable, operation);
		operation.VariablesConfiguration.injectVariables.push({
			...defaultVariableInjectionConfiguration,
			variablePathComponents,
			variableKind: InjectVariableKind.ENVIRONMENT_VARIABLE,
			environmentVariableName: arg.value.value,
		});
	});
};

const handleUuidDirectives = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	directivesNamed(variable, 'injectGeneratedUUID').forEach((directive) => {
		let variablePathComponents = directiveInjectedVariablePathComponents(directive, variable, operation);
		operation.VariablesConfiguration.injectVariables.push({
			...defaultVariableInjectionConfiguration,
			variablePathComponents,
			variableKind: InjectVariableKind.UUID,
		});
	});
};

const getTimeFormat = (timeFormat: string): string => {
	const availableTimeFormats: Record<string, string> = {
		ISO8601: '2006-01-02T15:04:05Z07:00',
		ANSIC: 'Mon Jan _2 15:04:05 2006',
		UnixDate: 'Mon Jan _2 15:04:05 MST 2006',
		RubyDate: 'Mon Jan 02 15:04:05 -0700 2006',
		RFC822: '02 Jan 06 15:04 MST',
		RFC822Z: '02 Jan 06 15:04 -0700',
		RFC850: 'Monday, 02-Jan-06 15:04:05 MST',
		RFC1123: 'Mon, 02 Jan 2006 15:04:05 MST',
		RFC1123Z: 'Mon, 02 Jan 2006 15:04:05 -0700',
		RFC3339: '2006-01-02T15:04:05Z07:00',
		RFC3339Nano: '2006-01-02T15:04:05.999999999Z07:00',
		Kitchen: '3:04PM',
		Stamp: 'Jan _2 15:04:05',
		StampMilli: 'Jan _2 15:04:05.000',
		StampMicro: 'Jan _2 15:04:05.000000',
		StampNano: 'Jan _2 15:04:05.000000000',
	};

	if (timeFormat in availableTimeFormats) {
		return availableTimeFormats[timeFormat];
	}
	throw new Error(`unknown time format "${timeFormat}`);
};

const handleDateTimeDirectives = (variable: VariableDefinitionNode, operation: GraphQLOperation) => {
	const directiveName = 'injectCurrentDateTime';
	directivesNamed(variable, directiveName).forEach((directive) => {
		const formatArg = directive.arguments?.find((arg) => arg.name.value === 'format');
		const customFormatArg = directive.arguments?.find((arg) => arg.name.value === 'customFormat');
		if (formatArg && customFormatArg) {
			throw new Error(`@${directiveName} in operation ${operation.Name} has both format: and customFormat: arguments`);
		}
		let dateFormat: string;
		if (formatArg) {
			if (formatArg.value.kind !== Kind.ENUM) {
				throw new Error(
					`format: argument in @${directiveName} in operation ${operation.Name} must be an enum, not ${formatArg.value.kind}`
				);
			}
			dateFormat = getTimeFormat(formatArg.value.value);
		} else if (customFormatArg) {
			if (customFormatArg.value.kind != Kind.STRING) {
				throw new Error(
					`customFormat: argument in @${directiveName} in operation ${operation.Name} must be a String, not ${customFormatArg.value.kind}`
				);
			}
			dateFormat = customFormatArg.value.value;
		} else {
			// Default format
			dateFormat = '2006-01-02T15:04:05Z07:00';
		}
		let variablePathComponents = directiveInjectedVariablePathComponents(directive, variable, operation);
		operation.VariablesConfiguration.injectVariables.push({
			...defaultVariableInjectionConfiguration,
			variablePathComponents,
			dateFormat: '2006-01-02T15:04:05Z07:00',
			variableKind: InjectVariableKind.DATE_TIME,
		});
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
			throw new Error(`invalid operation type ${node}`);
	}
};

const updateSkipFields = (skipFields: SchemaSkipFields, skipVariablePaths: string[]): SchemaSkipFields => {
	skipVariablePaths.forEach((field) => {
		let fields = skipFields;
		for (let component of field?.split('.')) {
			if (fields[component] === undefined) {
				fields[component] = {};
			}
			fields = fields[component];
		}
	});
	return skipFields;
};

const JSONSchemaResolveRef = (root: JSONSchema, ref: string) => {
	const prefix = '#/definitions/';
	if (!ref || !ref.startsWith(prefix)) {
		throw new Error(`invalid object ref ${ref}`);
	}
	const refName = ref.substring(prefix.length);
	const def = root.definitions ? root.definitions[refName] : null;
	if (!def) {
		throw new Error(`missing object definition for reference ${refName}`);
	}
	return def as JSONSchema;
};

const JSONSchemaPropertyResolvingRef = (root: JSONSchema, parent: JSONSchema, propName: string) => {
	let prop = parent.properties![propName] as JSONSchema;
	if (prop.$ref) {
		prop = JSONSchemaResolveRef(root, prop.$ref);
		parent.properties![propName] = prop;
	}
	return prop;
};

const JSONSchemaLookupPath = (schema: JSONSchema, pathComponents: string[]) => {
	let current = schema;
	for (let component of pathComponents) {
		if (
			current.type !== 'object' &&
			!(Array.isArray(current.type) && (current.type as unknown as string[]).indexOf('object') >= 0)
		) {
			throw new Error(`could not find ${component}, parent is not an object`);
		}
		if (!current.properties) {
			throw new Error(`could not find ${component}, schema is empty`);
		}
		let next = current.properties[component] as JSONSchema;
		if (!next) {
			throw new Error(
				`could not find ${component}, available fields are: ${Object.keys(current.properties).join(', ')}`
			);
		}
		if (next.$ref) {
			let resolved = JSONSchemaResolveRef(schema, next.$ref);
			if (!resolved) {
				throw new Error(`could not find ${component}, reference ${next.$ref} not found`);
			}
			next = resolved;
		}
		current = next;
	}
	return current;
};

const applySkipFields = (skipFields: SchemaSkipFields, root: JSONSchema, parent: JSONSchema, propName: string) => {
	const keys = Object.keys(skipFields);
	if (keys.length > 0) {
		let prop = JSONSchemaPropertyResolvingRef(root, parent, propName);
		for (const key of keys) {
			applySkipFields(skipFields[key], root, prop, key);
		}
	} else {
		// Leaf, remove from the schema
		delete parent.properties![propName];
		parent.required = parent.required?.filter((name) => name !== propName);
	}
};

export const operationVariablesToJSONSchema = (
	graphQLSchema: GraphQLSchema,
	operation: OperationDefinitionNode,
	interpolateVariableDefinitionAsJSON: string[],
	keepInternalVariables: boolean = false,
	keepInjectedVariables: boolean = false,
	customJsonScalars: Set<string>
): JSONSchema => {
	const schema: JSONSchema = {
		type: 'object',
		properties: {},
		additionalProperties: false,
	};

	if (!operation.variableDefinitions) {
		return schema;
	}

	operation.variableDefinitions.forEach((variable) => {
		let skipFields: SchemaSkipFields = {};
		if (!keepInternalVariables) {
			if (hasInternalVariable(variable)) {
				return;
			}
			updateSkipFields(skipFields, directiveDefinedFields(variable, internalVariables));
		}
		if (!keepInjectedVariables) {
			if (hasInjectedVariable(variable)) {
				return;
			}
			updateSkipFields(skipFields, directiveDefinedFields(variable, injectedVariables));
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
			customJsonScalars
		);
		if (Object.keys(skipFields).length > 0) {
			applySkipFields(skipFields, schema, schema, name);
		}
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

const directivesNamed = (variable: VariableDefinitionNode, directiveNames: string | string[]): ConstDirectiveNode[] => {
	const isDefined = (node: ConstDirectiveNode | undefined): node is ConstDirectiveNode => {
		return !!node;
	};
	if (!Array.isArray(directiveNames)) {
		directiveNames = [directiveNames];
	}
	return (
		variable.directives?.filter((directive) => directiveNames.includes(directive.name.value)).filter(isDefined) ?? []
	);
};

const directiveHasNoField = (node: ConstDirectiveNode) => {
	return !directiveInjectedField(node);
};

const directiveInjectedField = (node: ConstDirectiveNode) => {
	const onArgument = node.arguments?.find((arg) => arg.name.value === 'on');
	if (!onArgument) {
		return undefined;
	}
	if (onArgument.value.kind !== Kind.STRING) {
		return undefined;
	}
	return onArgument.value.value;
};

const hasInternalVariable = (variable: VariableDefinitionNode): boolean => {
	return (directivesNamed(variable, internalVariables)?.filter(directiveHasNoField)?.length ?? 0) > 0;
};

const hasInjectedVariable = (variable: VariableDefinitionNode): boolean => {
	return (directivesNamed(variable, injectedVariables)?.filter(directiveHasNoField)?.length ?? 0) > 0;
};

const directiveDefinedFields = (variable: VariableDefinitionNode, directiveNames: string[]) => {
	const isString = (field: string | undefined): field is string => {
		return !!field;
	};
	return (
		directivesNamed(variable, directiveNames)
			?.map((directive) => directiveInjectedField(directive))
			.filter(isString) ?? []
	);
};

// Leafs are fields that should be skipped from schema generation
interface SchemaSkipFields {
	[key: string]: SchemaSkipFields;
}

const typeSchema = (
	root: JSONSchema,
	parent: JSONSchema,
	graphQLSchema: GraphQLSchema,
	interpolateVariableDefinitionAsJSON: string[],
	type: TypeNode,
	name: string,
	nonNull: boolean,
	customJsonScalars: Set<string>
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
				customJsonScalars
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
				customJsonScalars
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
				case 'BigInt':
					return {
						type: nonNull ? ['string', 'number'] : ['string', 'number', 'null'],
					};
				default:
					if (customJsonScalars.has(type.name.value)) {
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
							return {
								type: nonNull ? 'string' : ['string', 'null'],
							};
						case 'EnumTypeDefinition':
							schema.type = nonNull ? 'string' : ['string', 'null'];
							schema['x-graphql-enum-name'] = namedType.name;
							schema.enum = (namedType.astNode.values || []).map((e) => {
								return e.name.value;
							});
							break;
						case 'InputObjectTypeDefinition':
							const directives = getDirectives(graphQLSchema, namedType);
							const hasOneOfDirective = directives.some((directive) => directive.name === 'oneOf');

							const typeName = namedType.name;
							if (!root.definitions) {
								root.definitions = {};
							}
							if (Object.keys(root.definitions!).includes(typeName)) {
								return {
									$ref: '#/definitions/' + typeName,
								};
							}
							root.definitions![typeName] = {
								type: nonNull ? 'object' : ['object', 'null'],
							};
							if (!hasOneOfDirective) {
								schema.additionalProperties = false;
							}
							schema.type = nonNull ? 'object' : ['object', 'null'];

							if (hasOneOfDirective) {
								schema.oneOf = [];

								(namedType.astNode.fields || []).forEach((f) => {
									const name = f.name.value;
									let fieldType = f.type;
									if (f.defaultValue !== undefined && fieldType.kind === 'NonNullType') {
										fieldType = fieldType.type;
									}

									const fieldSchema: JSONSchema = {
										type: 'object',
										additionalProperties: false,
										properties: {
											[name]: typeSchema(
												root,
												schema,
												graphQLSchema,
												interpolateVariableDefinitionAsJSON,
												fieldType,
												name,
												false,
												customJsonScalars
											),
										},
									};

									schema.oneOf!.push(fieldSchema);
								});
							} else {
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
										customJsonScalars
									);
								});
							}

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
	transformations: PostResolveTransformation[],
	customJsonScalars: Set<string>
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
		transformations,
		customJsonScalars
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
	transformations: PostResolveTransformation[],
	customJsonScalars: Set<string>
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
						transformations,
						customJsonScalars
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
							transformations,
							customJsonScalars
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
					transformations,
					customJsonScalars
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
					transformations,
					customJsonScalars
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
					transformations,
					customJsonScalars
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
	transformations: PostResolveTransformation[],
	customJsonScalars: Set<string>
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
						transformations,
						customJsonScalars
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
						transformations,
						customJsonScalars
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
					transformations,
					customJsonScalars
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
					if (customJsonScalars.has(fieldType.name.value)) {
						return {};
					}
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
								transformations,
								customJsonScalars
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

export const loadOperations = async (schemaFileName: string): Promise<LoadOperationsOutput> => {
	const operationsPath = path.join(process.env.WG_DIR_ABS!, 'operations');
	const fragmentsPath = path.join(process.env.WG_DIR_ABS!, 'fragments');
	const schemaFilePath = path.join(process.env.WG_DIR_ABS!, 'generated', schemaFileName);
	const outFilePath = path.join(process.env.WG_DIR_ABS!, 'generated', 'wundergraph.operations.json');
	// stdout is not displayed intentionally
	// we are only interested in the final result
	const result = await wunderctl({
		cmd: ['loadoperations', operationsPath, fragmentsPath, schemaFilePath],
	});
	if (result?.failed) {
		throw new Error(`Could not load operations: ${result?.stderr}`);
	}

	const output = fs.readFileSync(outFilePath, 'utf8');
	const out = JSON.parse(output) as LoadOperationsOutput;

	out.info?.forEach((msg) => Logger.info(msg));
	out.errors?.forEach((msg) => Logger.error(msg));

	if (out.errors?.length) {
		if (out.invalid?.length) {
			throw new Error(`Could not load operation '${out.invalid[0]}': ${out.errors[0]}`);
		} else {
			throw new Error(`Could not load operation: ${out.errors[0]}`);
		}
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

export const extractOperationDescription = (operation: string): string => {
	let line = -1;
	const document = parse(operation);
	visit(document, {
		OperationDefinition: (node) => {
			line = node.loc?.startToken.line || -1;
			return BREAK;
		},
	});
	if (line <= 0) {
		return '';
	}
	const operationComment: string[] = [];
	const lines = operation.split('\n');
	for (let i = line - 2; i >= 0; i--) {
		const trimmed = lines[i].trim();
		if (trimmed.startsWith('#')) {
			operationComment.push(trimmed.slice(1).trim());
		} else {
			break;
		}
	}
	const out = operationComment.reverse().join(' ');
	if (out.startsWith('This file is auto generated')) {
		return '';
	}
	return out;
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
