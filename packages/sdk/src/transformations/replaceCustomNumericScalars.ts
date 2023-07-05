import { GraphQLIntrospection } from '../definition';
import { parse, visit } from 'graphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { buildASTSchema } from 'graphql/index';

export interface ArgumentReplacement {
	fieldName: string;
	typeName: string;
	argName: string;
	renameTypeTo: string;
}

export interface ReplaceCustomNumericScalarsResult {
	schemaSDL: string;
	argumentReplacements: ArgumentReplacement[];
}

export const replaceCustomNumericScalars = (
	schemaSDL: string,
	introspection: GraphQLIntrospection
): ReplaceCustomNumericScalarsResult => {
	const customFloatScalars = introspection.customFloatScalars || [];
	const customIntScalars = introspection.customIntScalars || [];
	const argumentReplacements: ArgumentReplacement[] = [];

	let typeName: undefined | string;
	let fieldName: undefined | string;
	let argName: undefined | string;

	const ast = parse(schemaSDL);
	const cleanAst = visit(ast, {
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
			},
			leave: (node) => {
				typeName = undefined;
			},
		},
		FieldDefinition: {
			enter: (node) => {
				fieldName = node.name.value;
			},
			leave: (node) => {
				fieldName = undefined;
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				argName = node.name.value;
			},
			leave: (node) => {
				argName = undefined;
			},
		},
		ScalarTypeDefinition: (node) => {
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

			return node;
		},
	});

	const schema = printSchemaWithDirectives(buildASTSchema(cleanAst));
	return { schemaSDL: schema, argumentReplacements };
};
