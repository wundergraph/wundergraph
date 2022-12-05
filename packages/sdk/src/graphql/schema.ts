import {
	GraphQLSchema,
	Kind,
	OperationTypeDefinitionNode,
	OperationTypeNode,
	parse,
	print,
	printSchema,
	SchemaDefinitionNode,
	StringValueNode,
	visit,
} from 'graphql';
import { GraphQLIntrospection } from '../definition';

export interface ArgumentReplacement {
	fieldName: string;
	typeName: string;
	argName: string;
	renameTypeTo: string;
}

export interface CleanupSchemaResult {
	upstreamSchema: string;
	argumentReplacements: ArgumentReplacement[];
}

export const cleanupSchema = (schema: GraphQLSchema, introspection: GraphQLIntrospection): CleanupSchemaResult => {
	const customFloatScalars = introspection.customFloatScalars || [];
	const customIntScalars = introspection.customIntScalars || [];

	const printed = printSchema(schema);
	const ast = parse(printed);
	const queryTypeName = schema.getQueryType()?.name;
	const mutationTypeName = schema.getMutationType()?.name;
	const subscriptionTypeName = schema.getSubscriptionType()?.name;
	const argumentReplacements: ArgumentReplacement[] = [];
	let fieldName: undefined | string;
	let argName: undefined | string;
	let typeName: undefined | string;

	const cleanAst = visit(ast, {
		SchemaDefinition: (node) => {
			const operationTypes: OperationTypeDefinitionNode[] = [];
			if (queryTypeName) {
				operationTypes.push({
					kind: Kind.OPERATION_TYPE_DEFINITION,
					operation: OperationTypeNode.QUERY,
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Query',
						},
					},
				});
			}
			if (mutationTypeName) {
				operationTypes.push({
					kind: Kind.OPERATION_TYPE_DEFINITION,
					operation: OperationTypeNode.MUTATION,
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Mutation',
						},
					},
				});
			}
			if (subscriptionTypeName) {
				operationTypes.push({
					kind: Kind.OPERATION_TYPE_DEFINITION,
					operation: OperationTypeNode.SUBSCRIPTION,
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Subscription',
						},
					},
				});
			}
			const schemaNode: SchemaDefinitionNode = {
				...node,
				operationTypes,
			};
			return schemaNode;
		},
		InterfaceTypeDefinition: {
			enter: (node) => {
				typeName = node.name.value;
			},
			leave: () => {
				typeName = undefined;
			},
		},
		ObjectTypeExtension: {
			enter: (node) => {
				typeName = node.name.value;
			},
			leave: () => {
				typeName = undefined;
			},
		},
		InterfaceTypeExtension: {
			enter: (node) => {
				typeName = node.name.value;
			},
			leave: () => {
				typeName = undefined;
			},
		},
		ObjectTypeDefinition: {
			enter: (node) => {
				typeName = node.name.value;
				if (node.name.value === queryTypeName) {
					return {
						...node,
						name: {
							...node.name,
							value: 'Query',
						},
					};
				}

				if (node.name.value === mutationTypeName) {
					return {
						...node,
						name: {
							...node.name,
							value: 'Mutation',
						},
					};
				}

				if (node.name.value === subscriptionTypeName) {
					return {
						...node,
						name: {
							...node.name,
							value: 'Subscription',
						},
					};
				}

				switch (node.name.value) {
					case '_Service':
					case 'Entity':
						return null;
				}
				if (node.name.value.startsWith('__')) {
					return null;
				}
			},
			leave: (node) => {
				typeName = undefined;
			},
		},
		UnionTypeDefinition: (node) => {
			switch (node.name.value) {
				case '_Entity':
					return null;
			}
			if (node.name.value.startsWith('__')) {
				return null;
			}
		},
		ScalarTypeDefinition: (node) => {
			switch (node.name.value) {
				case '_Any':
				case '_FieldSet':
					return null;
			}
			if (node.name.value.startsWith('__')) {
				return null;
			}
			if (customFloatScalars.includes(node.name.value)) {
				return null;
			}
			if (customIntScalars.includes(node.name.value)) {
				return null;
			}
		},
		NamedType: (node) => {
			if (customFloatScalars.includes(node.name.value)) {
				if (argName && fieldName && typeName) {
					argumentReplacements.push({
						argName,
						fieldName,
						typeName,
						renameTypeTo: node.name.value,
					});
				}
				return {
					...node,
					name: {
						...node.name,
						value: 'Float',
					},
				};
			}
			if (customIntScalars.includes(node.name.value)) {
				if (argName && fieldName && typeName) {
					argumentReplacements.push({
						argName,
						fieldName,
						typeName,
						renameTypeTo: node.name.value,
					});
				}
				return {
					...node,
					name: {
						...node.name,
						value: 'Int',
					},
				};
			}
		},
		DirectiveDefinition: (node) => {
			switch (node.name.value) {
				case 'key':
				case 'extends':
				case 'external':
				case 'requires':
				case 'provides':
					return null;
			}
		},
		FieldDefinition: {
			enter: (node) => {
				fieldName = node.name.value;
				switch (node.name.value) {
					case '_entities':
					case '_service':
						return null;
				}
				if (node.name.value.startsWith('__')) {
					return null;
				}
				if (node.description) {
					if (node.description.value === '') {
						return {
							...node,
							description: undefined,
						};
					}
					if (node.description.block === true) {
						const description: StringValueNode = {
							...node.description,
							block: false,
						};
						return {
							...node,
							description,
						};
					}
				}
			},
			leave: (node) => {
				fieldName = undefined;
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				argName = node.name.value;
				if (node.description) {
					if (node.description.value === '') {
						return {
							...node,
							description: undefined,
						};
					}
					if (node.description.block === true) {
						const description: StringValueNode = {
							...node.description,
							block: false,
						};
						return {
							...node,
							description,
						};
					}
				}
			},
			leave: (node) => {
				argName = undefined;
			},
		},
	});

	return {
		upstreamSchema: print(cleanAst),
		argumentReplacements,
	};
};
