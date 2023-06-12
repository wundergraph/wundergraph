import {
	buildSchema,
	DirectiveDefinitionNode,
	DocumentNode,
	EnumTypeDefinitionNode,
	FieldDefinitionNode,
	GraphQLSchema,
	InputObjectTypeDefinitionNode,
	InterfaceTypeDefinitionNode,
	Kind,
	ObjectTypeDefinitionNode,
	parse,
	print,
	ScalarTypeDefinitionNode,
	SchemaDefinitionNode,
	UnionTypeDefinitionNode,
	visit,
} from 'graphql';
import { NamedTypeNode } from 'graphql/language/ast';
import {
	DataSourceCustomDatabase,
	DataSourceKind,
	DirectiveConfiguration,
	FieldConfiguration,
	TypeConfiguration,
	TypeField,
	SingleTypeField,
} from '@wundergraph/protobuf';
import { isRootType } from '../graphql/configuration';
import { Api, DataSource } from './index';

export const wellKnownTypeNames: string[] = [
	'Query',
	'Mutation',
	'Subscription',
	'String',
	'Int',
	'Boolean',
	'Float',
	'JSON',
	'ID',
	'DateTime',
	'BigInt',
	'Date',
	'Time',
	'UUID',
	'_Any',
	'UnspecifiedHttpResponse',
	'_Row',
];

const uniqueWellKnownTypes = (schema: DocumentNode): string[] => {
	const schemaDefinitionNode = schema.definitions.find((node) => node.kind === 'SchemaDefinition') as
		| SchemaDefinitionNode
		| undefined;
	const queryTypeName =
		schemaDefinitionNode?.operationTypes.find((op) => op.operation === 'query')?.type.name.value || 'Query';
	const mutationTypeName =
		schemaDefinitionNode?.operationTypes.find((op) => op.operation === 'mutation')?.type.name.value || 'Mutation';
	const subscriptionTypeName =
		schemaDefinitionNode?.operationTypes.find((op) => op.operation === 'subscription')?.type.name.value ||
		'Subscription';
	return [...new Set([...wellKnownTypeNames, queryTypeName, mutationTypeName, subscriptionTypeName])];
};

const wellKnownDirectives: string[] = ['include', 'skip', 'deprecated', 'specifiedBy'];
const omnigraphOpenApiDirectives: string[] = ['oneOf'];
const knownDirectives: string[] = [...wellKnownDirectives, ...omnigraphOpenApiDirectives];

export const applyNameSpaceToGraphQLSchema = (
	schema: string,
	skipRenameRootFields: string[],
	namespace?: string
): string => {
	if (namespace === undefined || namespace === '') {
		return print(parse(schema));
	}

	const document = parse(schema);
	const schemaDefinitionNode = document.definitions.find((node) => node.kind === 'SchemaDefinition') as
		| SchemaDefinitionNode
		| undefined;
	const queryTypeName =
		schemaDefinitionNode?.operationTypes.find((op) => op.operation === 'query')?.type.name.value || 'Query';
	const mutationTypeName =
		schemaDefinitionNode?.operationTypes.find((op) => op.operation === 'mutation')?.type.name.value || 'Mutation';
	const subscriptionTypeName =
		schemaDefinitionNode?.operationTypes.find((op) => op.operation === 'subscription')?.type.name.value ||
		'Subscription';
	const keepTypes = uniqueWellKnownTypes(document);
	const updated = visit(document, {
		ObjectTypeDefinition: {
			enter: (node) => {
				const keepName = keepTypes.find((keep) => keep === node.name.value) !== undefined;
				if (
					node.name.value === queryTypeName ||
					node.name.value === mutationTypeName ||
					node.name.value === subscriptionTypeName
				) {
					const updated: ObjectTypeDefinitionNode = {
						...node,
						fields: node.fields?.map((f) => {
							if (skipRenameRootFields.some((keep) => keep === f.name.value)) {
								return f;
							}
							const field: FieldDefinitionNode = {
								...f,
								name: {
									kind: Kind.NAME,
									loc: f.name.loc,
									value: namespace + '_' + f.name.value,
								},
							};
							return field;
						}),
						name: keepName
							? node.name
							: {
									kind: Kind.NAME,
									loc: node.name.loc,
									value: namespace + '_' + node.name.value,
							  },
					};
					return updated;
				}
				if (!keepName) {
					const updated: ObjectTypeDefinitionNode = {
						...node,
						name: {
							kind: Kind.NAME,
							loc: node.name.loc,
							value: namespace + '_' + node.name.value,
						},
					};
					return updated;
				}
			},
		},
		InterfaceTypeDefinition: {
			enter: (node) => {
				const updated: InterfaceTypeDefinitionNode = {
					...node,
					name: {
						kind: Kind.NAME,
						loc: node.name.loc,
						value: namespace + '_' + node.name.value,
					},
				};
				return updated;
			},
		},
		ScalarTypeDefinition: {
			enter: (node) => {
				const keep = keepTypes.find((keep) => keep === node.name.value) !== undefined;
				if (keep) {
					return;
				}
				const updated: ScalarTypeDefinitionNode = {
					...node,
					name: {
						kind: Kind.NAME,
						loc: node.name.loc,
						value: namespace + '_' + node.name.value,
					},
				};
				return updated;
			},
		},
		EnumTypeDefinition: {
			enter: (node) => {
				const updated: EnumTypeDefinitionNode = {
					...node,
					name: {
						kind: Kind.NAME,
						loc: node.name.loc,
						value: namespace + '_' + node.name.value,
					},
				};
				return updated;
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
				const updated: InputObjectTypeDefinitionNode = {
					...node,
					name: {
						kind: Kind.NAME,
						loc: node.name.loc,
						value: namespace + '_' + node.name.value,
					},
				};
				return updated;
			},
		},
		UnionTypeDefinition: {
			enter: (node) => {
				const updated: UnionTypeDefinitionNode = {
					...node,
					name: {
						kind: Kind.NAME,
						loc: node.name.loc,
						value: namespace + '_' + node.name.value,
					},
				};
				return updated;
			},
		},
		DirectiveDefinition: {
			enter: (node) => {
				if (knownDirectives.find((d) => d === node.name.value) !== undefined) {
					return; // skip well known
				}
				const updated: DirectiveDefinitionNode = {
					...node,
					name: {
						...node.name,
						value: namespace + '_' + node.name.value,
					},
				};
				return updated;
			},
		},
		NamedType: {
			enter: (node) => {
				const keep = keepTypes.find((keep) => keep === node.name.value) !== undefined;
				if (!keep) {
					const updated: NamedTypeNode = {
						...node,
						name: {
							kind: Kind.NAME,
							loc: node.name.loc,
							value: namespace + '_' + node.name.value,
						},
					};
					return updated;
				}
			},
		},
	});
	return print(updated);
};

export const applyNameSpaceToTypeFields = (
	fields: TypeField[],
	schema: GraphQLSchema,
	namespace?: string
): TypeField[] => {
	if (namespace === undefined || namespace === '') {
		return fields;
	}
	return fields.map((typeField) => {
		const isRoot = isRootType(typeField.typeName, schema);
		return {
			typeName: isRoot ? typeField.typeName : namespace + '_' + typeField.typeName,
			fieldNames: isRoot ? typeField.fieldNames.map((f) => namespace + '_' + f) : typeField.fieldNames,
		};
	});
};

export const applyNameSpaceToSingleTypeFields = (
	fields: SingleTypeField[],
	schema: GraphQLSchema,
	namespace?: string
): SingleTypeField[] => {
	if (namespace === undefined || namespace === '') {
		return fields;
	}
	return fields.map((field) => {
		const isRoot = isRootType(field.typeName, schema);
		return {
			typeName: isRoot ? field.typeName : namespace + '_' + field.typeName,
			fieldName: isRoot ? namespace + '_' + field.fieldName : field.fieldName,
		};
	});
};

export const applyNameSpaceToFieldConfigurations = (
	fields: FieldConfiguration[],
	schema: GraphQLSchema,
	skipRenameRootFields: string[],
	namespace?: string
): FieldConfiguration[] => {
	if (namespace === undefined || namespace === '') {
		return fields;
	}
	const mapped = fields.map((field) => {
		const isRoot = isRootType(field.typeName, schema);
		const skipRename = skipRenameRootFields.find((skip) => skip === field.fieldName) !== undefined;
		return {
			...field,
			typeName: isRoot ? field.typeName : namespace + '_' + field.typeName,
			fieldName: isRoot && !skipRename ? namespace + '_' + field.fieldName : field.fieldName,
			path: field.disableDefaultFieldMapping ? [] : [field.fieldName],
		};
	});

	const queryType = schema.getQueryType();
	if (queryType) {
		const fields = queryType.getFields();
		Object.keys(fields).forEach((key) => {
			const field = fields[key];
			const skipRename = skipRenameRootFields.find((skip) => skip === field.name) !== undefined;
			const namespacedFieldName = skipRename ? field.name : namespace + '_' + field.name;
			const exists = mapped.find((e) => e.typeName === queryType.name && e.fieldName === namespacedFieldName);
			if (exists) {
				return;
			}
			mapped.push({
				typeName: queryType.name,
				fieldName: namespacedFieldName,
				disableDefaultFieldMapping: false,
				path: [field.name],
				argumentsConfiguration: [],
				requiresFields: [],
				unescapeResponseJson: false,
			});
		});
	}

	const mutationType = schema.getMutationType();
	if (mutationType) {
		const fields = mutationType.getFields();
		Object.keys(fields).forEach((key) => {
			const field = fields[key];
			const namespacedFieldName = namespace + '_' + field.name;
			const exists = mapped.find((e) => e.typeName === mutationType.name && e.fieldName === namespacedFieldName);
			if (exists) {
				return;
			}
			mapped.push({
				typeName: mutationType.name,
				fieldName: namespace + '_' + field.name,
				disableDefaultFieldMapping: false,
				path: [field.name],
				argumentsConfiguration: [],
				requiresFields: [],
				unescapeResponseJson: false,
			});
		});
	}

	const subscriptionType = schema.getSubscriptionType();
	if (subscriptionType) {
		const fields = subscriptionType.getFields();
		Object.keys(fields).forEach((key) => {
			const field = fields[key];
			const namespacedFieldName = namespace + '_' + field.name;
			const exists = mapped.find((e) => e.typeName === subscriptionType.name && e.fieldName === namespacedFieldName);
			if (exists) {
				return;
			}
			mapped.push({
				typeName: subscriptionType.name,
				fieldName: namespacedFieldName,
				disableDefaultFieldMapping: false,
				path: [field.name],
				argumentsConfiguration: [],
				requiresFields: [],
				unescapeResponseJson: false,
			});
		});
	}

	return mapped;
};

export const applyNamespaceToExistingRootFieldConfigurations = (
	fields: FieldConfiguration[],
	schema: GraphQLSchema,
	namespace?: string
): FieldConfiguration[] => {
	if (namespace === undefined || namespace === '') {
		return fields;
	}
	return fields.map((field) => {
		const isRoot = isRootType(field.typeName, schema);
		return {
			...field,
			typeName: isRoot ? field.typeName : namespace + '_' + field.typeName,
			fieldName: isRoot ? namespace + '_' + field.fieldName : field.fieldName,
		};
	});
};

export const applyNamespaceToExistingRootFieldConfigurationsWithPathRewrite = (
	fields: FieldConfiguration[],
	schema: GraphQLSchema,
	namespace?: string
): FieldConfiguration[] => {
	if (namespace === undefined || namespace === '') {
		return fields;
	}
	return fields.map((field) => {
		const isRoot = isRootType(field.typeName, schema);
		const hasPath = field.path.length !== 0;
		const path = hasPath ? field.path : isRoot ? [field.fieldName] : field.path;
		return {
			...field,
			path,
			typeName: isRoot ? field.typeName : namespace + '_' + field.typeName,
			fieldName: isRoot ? namespace + '_' + field.fieldName : field.fieldName,
		};
	});
};

export const generateTypeConfigurationsForNamespace = (schema: string, namespace?: string): TypeConfiguration[] => {
	if (namespace === undefined || namespace === '') {
		return [];
	}
	const out: TypeConfiguration[] = [];
	const document = parse(schema);
	const keep = uniqueWellKnownTypes(document);
	visit(document, {
		InputObjectTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		ObjectTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		EnumTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		UnionTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		ScalarTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		InterfaceTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
	});
	return out;
};

export const generateTypeConfigurationsForNamespaceWithExisting = (
	schema: string,
	existing: TypeConfiguration[],
	namespace?: string
): TypeConfiguration[] => {
	if (namespace === undefined || namespace === '') {
		return [];
	}
	const out: TypeConfiguration[] = existing;
	const document = parse(schema);
	const keep = uniqueWellKnownTypes(document);
	visit(document, {
		InputObjectTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		ObjectTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		EnumTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		UnionTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		ScalarTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
		InterfaceTypeDefinition: (node) => pushTypeConfiguration(out, keep, namespace, node),
	});
	return out;
};

const pushTypeConfiguration = (
	out: TypeConfiguration[],
	keep: string[],
	namespace: string,
	node:
		| InputObjectTypeDefinitionNode
		| ObjectTypeDefinitionNode
		| EnumTypeDefinitionNode
		| UnionTypeDefinitionNode
		| ScalarTypeDefinitionNode
		| InterfaceTypeDefinitionNode
) => {
	const typeName = node.name.value;
	if (keep.find((k) => k === typeName) !== undefined) {
		return;
	}
	const existing = out.find((t) => t.typeName === typeName);
	if (existing !== undefined) {
		existing.typeName = namespace + '_' + typeName;
		return;
	}
	out.push({
		typeName: namespace + '_' + typeName,
		renameTo: typeName,
	});
};

export const applyNamespaceToDirectiveConfiguration = (
	schema: GraphQLSchema,
	namespace?: string
): DirectiveConfiguration[] => {
	if (namespace === undefined || namespace === '') {
		return [];
	}
	const out: DirectiveConfiguration[] = [];
	schema.getDirectives().forEach((directive) => {
		if (knownDirectives.find((w) => w === directive.name) !== undefined) {
			return;
		}
		out.push({
			directiveName: namespace + '_' + directive.name,
			renameTo: directive.name,
		});
	});
	return out;
};

export const applyNamespaceToApi = (api: Api<unknown>, apiNamespace: string, skipRenameRootFields: string[]) => {
	const schema = buildSchema(api.Schema);
	const datasources = api.DataSources.map((ds) => ({
		...ds,
		RootNodes: applyNameSpaceToTypeFields(ds.RootNodes, schema, apiNamespace),
		ChildNodes: applyNameSpaceToTypeFields(ds.ChildNodes, schema, apiNamespace),
		Custom: applyNamespaceToDataSourceCustom(ds, apiNamespace),
	}));
	const appliedSchema = applyNameSpaceToGraphQLSchema(api.Schema, skipRenameRootFields, apiNamespace);
	const fields = applyNamespaceToExistingRootFieldConfigurationsWithPathRewrite(api.Fields, schema, apiNamespace);
	const types = generateTypeConfigurationsForNamespaceWithExisting(api.Schema, api.Types, apiNamespace);
	const interpolateVariableDefinitionAsJSON = api.interpolateVariableDefinitionAsJSON.map(
		(type) => `${apiNamespace}_${type}`
	);
	return new Api(appliedSchema, apiNamespace, datasources, fields, types, interpolateVariableDefinitionAsJSON);
};

const applyNamespaceToDataSourceCustom = (datasource: DataSource, namespace?: string): any => {
	switch (datasource.Kind) {
		case DataSourceKind.SQLSERVER:
		case DataSourceKind.MYSQL:
		case DataSourceKind.POSTGRESQL:
		case DataSourceKind.SQLITE:
		case DataSourceKind.MONGODB:
			const custom = datasource.Custom as DataSourceCustomDatabase;
			return {
				...custom,
				jsonTypeFields: applyNameSpaceToSingleTypeFields(
					custom.jsonTypeFields,
					buildSchema(custom.graphqlSchema),
					namespace
				),
			};
		default:
			return datasource.Custom;
	}
};
