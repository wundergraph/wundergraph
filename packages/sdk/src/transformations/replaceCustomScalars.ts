import { GraphQLIntrospection, OpenAPIIntrospection, ReplaceCustomScalarTypeFieldConfiguration } from '../definition';
import { parse, print, visit } from 'graphql';
import { SingleTypeField } from '@wundergraph/protobuf';

export interface ReplaceCustomScalarsResult {
	schemaSDL: string;
	customScalarTypeFields: SingleTypeField[];
}

export const replaceCustomScalars = (
	schemaSDL: string,
	introspection: GraphQLIntrospection | OpenAPIIntrospection
): ReplaceCustomScalarsResult => {
	if (introspection.schemaExtension) {
		schemaSDL = schemaSDL + ' ' + introspection.schemaExtension;
	} else {
		return { schemaSDL, customScalarTypeFields: [] };
	}

	let insideCustomScalarType = false;
	let insideCustomScalarField = false;
	let replaceCustomScalarType: ReplaceCustomScalarTypeFieldConfiguration | undefined;
	let replaceWith = '';
	let currentTypeName = '';
	let customScalarTypeFields: SingleTypeField[] = [];

	const ast = parse(schemaSDL);
	const cleanAst = visit(ast, {
		ObjectTypeDefinition: {
			enter: (node) => {
				introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
					if (node.name.value.match(replace.entityName)) {
						insideCustomScalarType = true;
						currentTypeName = node.name.value;
					}
				});
			},
			leave: (_) => {
				insideCustomScalarType = false;
				replaceCustomScalarType = undefined;
			},
		},
		FieldDefinition: {
			enter: (node) => {
				if (insideCustomScalarType) {
					introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
						if (node.name.value.match(replace.fieldName)) {
							insideCustomScalarField = true;
							replaceCustomScalarType = replace;
							replaceWith = replace.responseTypeReplacement;
						}
					});
				}

				if (insideCustomScalarField) {
					if (!customScalarTypeFields.some((f) => f.typeName === currentTypeName && f.fieldName === node.name.value)) {
						customScalarTypeFields.push({
							typeName: currentTypeName,
							fieldName: node.name.value,
						});
					}
				}
			},
			leave: (_) => {
				insideCustomScalarField = false;
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
				introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
					if (node.name.value.match(replace.entityName)) {
						insideCustomScalarType = true;
						currentTypeName = node.name.value;
					}
				});
			},
			leave: (_) => {
				insideCustomScalarType = false;
				replaceCustomScalarType = undefined;
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				if (insideCustomScalarType) {
					introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
						if (node.name.value.match(replace.fieldName) && replace.inputTypeReplacement) {
							insideCustomScalarField = true;
							replaceCustomScalarType = replace;
							replaceWith = replace.inputTypeReplacement;
						}
					});
				}
			},
			leave: (_) => {
				insideCustomScalarField = false;
			},
		},
		NamedType: (node) => {
			if (insideCustomScalarField && insideCustomScalarType && replaceCustomScalarType) {
				return {
					...node,
					name: {
						...node.name,
						value: replaceWith,
					},
				};
			}
		},
	});

	const schema = print(cleanAst);

	return { schemaSDL: schema, customScalarTypeFields: customScalarTypeFields };
};
