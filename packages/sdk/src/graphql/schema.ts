import {
	GraphQLSchema,
	Kind,
	NameNode,
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

export const cleanupSchema = (schema: GraphQLSchema, introspection: GraphQLIntrospection): string => {
	const customFloatScalars = introspection.customFloatScalars || [];
	const customIntScalars = introspection.customIntScalars || [];

	const printed = printSchema(schema);
	const ast = parse(printed);
	const queryTypeName = schema.getQueryType()?.name;
	const mutationTypeName = schema.getMutationType()?.name;
	const subscriptionTypeName = schema.getSubscriptionType()?.name;

	const replaceOperationTypeName = (name: NameNode): NameNode => {
		if (name.value === queryTypeName) {
			return {
				...name,
				value: 'Query',
			};
		}

		if (name.value === mutationTypeName) {
			return {
				...name,
				value: 'Mutation',
			};
		}

		if (name.value === subscriptionTypeName) {
			return {
				...name,
				value: 'Subscription',
			};
		}

		return name;
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
		ObjectTypeDefinition: (node) => {
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
				return {
					...node,
					name: {
						...node.name,
						value: 'Float',
					},
				};
			}
			if (customIntScalars.includes(node.name.value)) {
				return {
					...node,
					name: {
						...node.name,
						value: 'Int',
					},
				};
			}

			return {
				...node,
				name: replaceOperationTypeName(node.name),
			};
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
		},
		InputValueDefinition: {
			enter: (node) => {
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
		},
	});

	return print(cleanAst);
};
