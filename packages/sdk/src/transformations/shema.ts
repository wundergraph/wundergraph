import { GraphQLIntrospection, OpenAPIIntrospection, ReplaceCustomScalarTypeFieldConfiguration } from '../definition';
import { parse, print, visit } from 'graphql/index';

const replaceCustomScalars = (
	schemaSDL: string,
	introspection: GraphQLIntrospection | OpenAPIIntrospection
): string => {
	if (introspection.schemaExtension) {
		schemaSDL = schemaSDL + ' ' + introspection.schemaExtension;
	} else {
		return schemaSDL;
	}

	let insideCustomScalarType = false;
	let insideCustomScalarField = false;
	let replaceCustomScalarType: ReplaceCustomScalarTypeFieldConfiguration | undefined;
	let replaceWith = '';

	const ast = parse(schemaSDL);
	const cleanAst = visit(ast, {
		ObjectTypeDefinition: {
			enter: (node) => {
				introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
					if (node.name.value.match(replace.entityName)) {
						insideCustomScalarType = true;
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

	return print(cleanAst);
};

const transformSchema = {
	replaceCustomScalars,
};

export default transformSchema;
