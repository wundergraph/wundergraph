import {
	buildASTSchema,
	GraphQLSchema,
	Kind,
	NameNode,
	OperationTypeDefinitionNode,
	OperationTypeNode,
	parse,
	SchemaDefinitionNode,
	StringValueNode,
	visit,
} from 'graphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

/*
	cleanupSchema - cleans up the upstream schema by removing service fields, federation directives,
	and replacing the operation type names with the standard names. 
 */
export const cleanupSchema = (schema: GraphQLSchema): string => {
	const printed = printSchemaWithDirectives(schema);
	const ast = parse(printed);
	const queryTypeName = schema.getQueryType()?.name;
	const mutationTypeName = schema.getMutationType()?.name;
	const subscriptionTypeName = schema.getSubscriptionType()?.name;
	let fieldName: undefined | string;
	let argName: undefined | string;
	let typeName: undefined | string;

	const replaceOperationTypeName = (name: NameNode): NameNode => {
		switch (name.value) {
			case queryTypeName:
				return {
					...name,
					value: 'Query',
				};
			case mutationTypeName:
				return {
					...name,
					value: 'Mutation',
				};
			case subscriptionTypeName:
				return {
					...name,
					value: 'Subscription',
				};
			default:
				return name;
		}
	};

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
				switch (node.name.value) {
					case '_Service':
					case 'Entity':
						return null;
				}
				if (node.name.value.startsWith('__')) {
					return null;
				}

				return {
					...node,
					name: replaceOperationTypeName(node.name),
				};
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
		},
		NamedType: (node) => {
			return {
				...node,
				name: replaceOperationTypeName(node.name),
			};
		},
		DirectiveDefinition: (node) => {
			switch (node.name.value) {
				// federation directives:
				case 'key':
				case 'extends':
				case 'external':
				case 'requires':
				case 'provides':
				// omnigraph/openapi directives:
				case 'enum':
				case 'example':
				case 'globalOptions':
				case 'httpOperation':
				case 'resolveRoot':
				case 'typescript':
				// omnigraph/soap directives:
				case 'soap':
					return null;
				default:
					return node;
			}
		},
		Directive: (node) => {
			switch (node.name.value) {
				// omnigraph/openapi directives:
				case 'enum':
				case 'example':
				case 'globalOptions':
				case 'httpOperation':
				case 'resolveRoot':
				case 'typescript':
				// omnigraph/soap directives:
				case 'soap':
				// federation directives:
				case 'key':
				case 'extends':
				case 'external':
				case 'requires':
				case 'provides':
					return null;
				default:
					return node;
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

	return printSchemaWithDirectives(buildASTSchema(cleanAst));
};
