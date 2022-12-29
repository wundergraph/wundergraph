import {
	buildASTSchema,
	DocumentNode,
	GraphQLSchema,
	OperationDefinitionNode,
	parse,
	SelectionSetNode,
	visit,
} from 'graphql';
import {
	ArgumentConfiguration,
	ArgumentRenderConfiguration,
	ArgumentSource,
	FieldConfiguration,
	TypeConfiguration,
	TypeField,
} from '@wundergraph/protobuf';
import { TypeNode } from 'graphql/language/ast';
import { Kind } from 'graphql/language/kinds';

const DefaultJsonTypes = ['JSON', 'JSONObject'];

export interface GraphQLConfiguration {
	RootNodes: TypeField[];
	ChildNodes: TypeField[];
	Fields: FieldConfiguration[];
	Types: TypeConfiguration[];
}

export const configuration = (schema: DocumentNode, serviceSDL?: DocumentNode): GraphQLConfiguration => {
	const config: GraphQLConfiguration = {
		RootNodes: [],
		ChildNodes: [],
		Fields: [],
		Types: [],
	};
	if (serviceSDL !== undefined) {
		visitSchema(serviceSDL, config);
	} else {
		visitSchema(schema, config);
	}
	return config;
};

interface JsonTypeField {
	typeName: string;
	fieldName: string;
}

const visitSchema = (schema: DocumentNode, config: GraphQLConfiguration) => {
	let typeName: undefined | string;
	let fieldName: undefined | string;
	let isExtensionType = false;
	let hasExtensionDirective = false;
	let isEntity = false;
	let isExternalField = false;
	let entityFields: string[] = [];
	let jsonFields: JsonTypeField[] = [];

	const graphQLSchema = buildASTSchema(schema, { assumeValidSDL: true });

	visit(schema, {
		ObjectTypeDefinition: {
			enter: (node) => {
				typeName = node.name.value;
				isExtensionType = false;
				isEntity = false;
			},
			leave: () => {
				typeName = undefined;
				isExtensionType = false;
				hasExtensionDirective = false;
				entityFields = [];
				isEntity = false;
			},
		},
		InterfaceTypeDefinition: {
			enter: (node) => {
				typeName = node.name.value;
				isExtensionType = false;
				isEntity = false;
			},
			leave: () => {
				typeName = undefined;
				isExtensionType = false;
				hasExtensionDirective = false;
				entityFields = [];
				isEntity = false;
			},
		},
		ObjectTypeExtension: {
			enter: (node) => {
				typeName = node.name.value;
				isExtensionType = true;
				isEntity = false;
			},
			leave: () => {
				typeName = undefined;
				isExtensionType = false;
				hasExtensionDirective = false;
				entityFields = [];
			},
		},
		InterfaceTypeExtension: {
			enter: (node) => {
				typeName = node.name.value;
				isExtensionType = true;
				isEntity = false;
			},
			leave: () => {
				typeName = undefined;
				isExtensionType = false;
				hasExtensionDirective = false;
				entityFields = [];
			},
		},
		Directive: {
			enter: (node) => {
				switch (node.name.value) {
					case 'extends':
						hasExtensionDirective = true;
						return;
					case 'key':
						isEntity = true;
						if (!node.arguments) {
							return;
						}
						const fields = node.arguments.find((arg) => arg.name.value === 'fields');
						if (!fields) {
							return;
						}
						if (fields.value.kind !== 'StringValue') {
							return;
						}
						const fieldsValue = fields.value.value;
						const fieldsSelection = parseSelectionSet('{ ' + fieldsValue + ' }');
						fieldsSelection.selections.forEach((s) => {
							if (s.kind !== 'Field') {
								return;
							}
							entityFields.push(s.name.value);
						});
						return;
					case 'external':
						isExternalField = true;
				}
			},
		},
		FieldDefinition: {
			enter: (node) => {
				fieldName = node.name.value;

				if (isJsonField(node.type, DefaultJsonTypes)) {
					jsonFields.push({ typeName: typeName!, fieldName: fieldName! });
				}
			},
			leave: () => {
				if (typeName === undefined || fieldName === undefined) {
					return;
				}
				const isRoot = isRootType(typeName, graphQLSchema);
				if (isRoot) {
					addTypeField(config.RootNodes, typeName, fieldName);
				}

				const isExtension = isExtensionType || hasExtensionDirective;
				const isFederationRootNode = isExtension && isEntity && !isExternalField;
				const isEntityField = entityFields.find((f) => f === fieldName) !== undefined;

				if (isEntity && !isExternalField) {
					addTypeField(config.RootNodes, typeName, fieldName);
				}

				if (isFederationRootNode) {
					addTypeField(config.RootNodes, typeName, fieldName);
					addRequiredFields(typeName, fieldName, config, entityFields);
				}

				if (!isRoot && !isFederationRootNode && !isExternalField) {
					addTypeField(config.ChildNodes, typeName, fieldName);
				}

				if (isExternalField && isEntityField) {
					addTypeField(config.ChildNodes, typeName, fieldName);
				}

				if (isEntity && !isEntityField && !isExternalField && !isFederationRootNode) {
					addRequiredFields(typeName, fieldName, config, entityFields);
				}

				fieldName = undefined;
				isExternalField = false;
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				if (!fieldName || !typeName) {
					return;
				}
				addFieldArgument(typeName, fieldName, node.name.value, config);
			},
		},
	});

	addJsonFieldConfigurations(config, jsonFields);
};

const parseSelectionSet = (selectionSet: string): SelectionSetNode => {
	const query = parse(selectionSet).definitions[0] as OperationDefinitionNode;
	return query.selectionSet;
};

export const isRootType = (typeName: string, schema: GraphQLSchema) => {
	const queryType = schema.getQueryType();
	if (queryType && queryType.astNode && queryType.astNode.name.value === typeName) {
		return true;
	}
	const mutationType = schema.getMutationType();
	if (mutationType && mutationType.astNode && mutationType.astNode.name.value === typeName) {
		return true;
	}
	const subscriptionType = schema.getSubscriptionType();
	if (subscriptionType && subscriptionType.astNode && subscriptionType.astNode.name.value === typeName) {
		return true;
	}
	const typeDefinition = schema.getType(typeName);
	if (
		typeDefinition === undefined ||
		typeDefinition === null ||
		typeDefinition.astNode === undefined ||
		typeDefinition.astNode === null
	) {
		return;
	}
	return false;
};

const addTypeField = (typeFields: TypeField[], typeName: string, fieldName: string) => {
	const i = typeFields.findIndex((t) => t.typeName === typeName);
	if (i !== -1) {
		addField(typeFields[i], fieldName);
		return;
	}
	const typeField: TypeField = {
		typeName: typeName,
		fieldNames: [],
	};
	addField(typeField, fieldName);
	typeFields.push(typeField);
};

const addField = (typeField: TypeField, field: string) => {
	const i = typeField.fieldNames.findIndex((f) => f === field);
	if (i !== -1) {
		return;
	}
	typeField.fieldNames.push(field);
};

const addFieldArgument = (typeName: string, fieldName: string, argName: string, config: GraphQLConfiguration) => {
	const arg: ArgumentConfiguration = {
		name: argName,
		sourceType: ArgumentSource.FIELD_ARGUMENT,
		sourcePath: [],
		renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_DEFAULT,
	};
	let field: FieldConfiguration | undefined = findField(config.Fields, typeName, fieldName);
	if (!field) {
		config.Fields.push({
			typeName: typeName,
			fieldName: fieldName,
			argumentsConfiguration: [arg],
			disableDefaultFieldMapping: false,
			path: [],
			requiresFields: [],
			unescapeResponseJson: false,
		});
		return;
	}
	if (!field.argumentsConfiguration) {
		field.argumentsConfiguration = [arg];
		return;
	}
	const i = field.argumentsConfiguration.findIndex((a) => a.name === argName);
	if (i !== -1) {
		field.argumentsConfiguration[i] = arg;
		return;
	}
	field.argumentsConfiguration.push(arg);
};

const addRequiredFields = (
	typeName: string,
	fieldName: string,
	config: GraphQLConfiguration,
	requiredFieldNames: string[]
) => {
	requiredFieldNames.forEach((f) => {
		addRequiredField(typeName, fieldName, config, f);
	});
};

const addRequiredField = (
	typeName: string,
	fieldName: string,
	config: GraphQLConfiguration,
	requiredFieldName: string
) => {
	let field: FieldConfiguration | undefined = findField(config.Fields, typeName, fieldName);
	if (!field) {
		config.Fields.push({
			typeName: typeName,
			fieldName: fieldName,
			requiresFields: [requiredFieldName],
			argumentsConfiguration: [],
			path: [],
			disableDefaultFieldMapping: false,
			unescapeResponseJson: false,
		});
		return;
	}
	if (!field.requiresFields) {
		field.requiresFields = [requiredFieldName];
		return;
	}
	const exists = field.requiresFields.find((f) => f === requiredFieldName) !== undefined;
	if (exists) {
		return;
	}
	field.requiresFields.push(requiredFieldName);
};

const addJsonFieldConfigurations = (config: GraphQLConfiguration, jsonFields: JsonTypeField[]) => {
	for (const jsonField of jsonFields) {
		let field: FieldConfiguration | undefined = findField(config.Fields, jsonField.typeName, jsonField.fieldName);

		if (field) {
			field.unescapeResponseJson = true;
		} else {
			config.Fields.push({
				typeName: jsonField.typeName,
				fieldName: jsonField.fieldName,
				argumentsConfiguration: [],
				disableDefaultFieldMapping: false,
				path: [],
				requiresFields: [],
				unescapeResponseJson: true,
			});
		}
	}
};

const findField = (fields: FieldConfiguration[], typeName: string, fieldName: string) => {
	return fields.find((f) => f.typeName === typeName && f.fieldName === fieldName);
};

const isJsonField = (type: TypeNode, jsonTypes: string[]) => {
	const namedTypeName = resolveNamedTypeName(type);

	for (const jsonType of jsonTypes) {
		if (namedTypeName === jsonType) {
			return true;
		}
	}

	return false;
};

const resolveNamedTypeName = (type: TypeNode): string => {
	switch (type.kind) {
		case Kind.NON_NULL_TYPE:
			return resolveNamedTypeName(type.type);
		case Kind.LIST_TYPE:
			return resolveNamedTypeName(type.type);
		default:
			return type.name.value;
	}
};
