import {
	GraphQLIntrospection,
	OpenAPIIntrospection,
	ReplaceScalarsWithCustomScalarsConfiguration,
} from '../definition';
import { parse, print, visit } from 'graphql';
import { SingleTypeField } from '@wundergraph/protobuf';

export interface ReplaceScalarsWithCustomScalarsResult {
	schemaSDL: string;
	replacementScalarFields: SingleTypeField[];
}

type CustomScalarReplacementData = {
	fieldName: string;
	replacementScalarName: string;
};

export const replaceScalarsWithCustomScalars = (
	schemaSDL: string,
	introspection: GraphQLIntrospection | OpenAPIIntrospection
): ReplaceScalarsWithCustomScalarsResult => {
	const replacements = introspection.replaceScalarsWithCustomScalars;
	if (!replacements || replacements.length < 1) {
		return { schemaSDL, replacementScalarFields: [] };
	}
	const replacementsByParentName = getCustomScalarReplacementsByParent(replacements);
	let currentValidParentTypeName = '';
	let customScalarReplacementName = '';
	const replacementScalars: Set<SingleTypeField> = new Set<SingleTypeField>();

	const ast = parse(schemaSDL);
	const astWithReplacements = visit(ast, {
		ObjectTypeDefinition: {
			enter: (node) => {
				if (replacementsByParentName.get(node.name.value)) {
					currentValidParentTypeName = node.name.value;
				}
			},
			leave: (_) => {
				currentValidParentTypeName = '';
				customScalarReplacementName = '';
			},
		},
		FieldDefinition: {
			enter: (node) => {
				const value = replacementsByParentName.get(currentValidParentTypeName);
				if (value && value.fieldName === node.name.value) {
					customScalarReplacementName = value.replacementScalarName;
					replacementScalars.add({
						typeName: currentValidParentTypeName,
						fieldName: node.name.value,
					});
				}
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
				if (replacementsByParentName.get(node.name.value)) {
					currentValidParentTypeName = node.name.value;
				}
			},
			leave: (_) => {
				currentValidParentTypeName = '';
				customScalarReplacementName = '';
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				const value = replacementsByParentName.get(currentValidParentTypeName);
				if (value && value.fieldName === node.name.value) {
					customScalarReplacementName = value.replacementScalarName;
					replacementScalars.add({
						typeName: currentValidParentTypeName,
						fieldName: node.name.value,
					});
				}
			},
		},
		NamedType: (node) => {
			if (customScalarReplacementName.length > 0) {
				return {
					...node,
					name: {
						...node.name,
						value: customScalarReplacementName,
					},
				};
			}
		},
	});

	const schema = print(astWithReplacements);

	return { schemaSDL: schema, replacementScalarFields: Array.from(replacementScalars) };
};

const getCustomScalarReplacementsByParent = (
	replacements: ReplaceScalarsWithCustomScalarsConfiguration[]
): Map<string, CustomScalarReplacementData> => {
	const replacementsByParent = new Map<string, CustomScalarReplacementData>();
	replacements.forEach((replacement) => {
		replacementsByParent.set(replacement.exactParentTypeName, {
			fieldName: replacement.exactFieldName,
			replacementScalarName: replacement.exactReplacementScalarName,
		});
	});
	return replacementsByParent;
};
