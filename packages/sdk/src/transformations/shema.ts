import { ReplaceJSONTypeFieldConfiguration } from '../definition';
import { parse, print, visit } from 'graphql/index';

const replaceCustomScalars = <
	T extends {
		schemaExtension?: string | undefined;
		replaceJSONTypeFields?: ReplaceJSONTypeFieldConfiguration[] | undefined;
	}
>(
	schemaSDL: string,
	introspection: T
): string => {
	if (introspection.schemaExtension) {
		schemaSDL = schemaSDL + ' ' + introspection.schemaExtension;
	} else {
		return schemaSDL;
	}

	let insideJSONType = false;
	let insideJSONField = false;
	let replaceJSONType: ReplaceJSONTypeFieldConfiguration | undefined;
	let replaceWith = '';

	const ast = parse(schemaSDL);
	const cleanAst = visit(ast, {
		ObjectTypeDefinition: {
			enter: (node) => {
				introspection.replaceJSONTypeFields?.forEach((replace) => {
					if (node.name.value.match(replace.entityName)) {
						insideJSONType = true;
					}
				});
			},
			leave: (_) => {
				insideJSONType = false;
				replaceJSONType = undefined;
			},
		},
		FieldDefinition: {
			enter: (node) => {
				if (insideJSONType) {
					introspection.replaceJSONTypeFields?.forEach((replace) => {
						if (node.name.value.match(replace.fieldName)) {
							insideJSONField = true;
							replaceJSONType = replace;
							replaceWith = replace.responseTypeReplacement;
						}
					});
				}
			},
			leave: (_) => {
				insideJSONField = false;
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
				introspection.replaceJSONTypeFields?.forEach((replace) => {
					if (node.name.value.match(replace.entityName)) {
						insideJSONType = true;
					}
				});
			},
			leave: (_) => {
				insideJSONType = false;
				replaceJSONType = undefined;
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				if (insideJSONType) {
					introspection.replaceJSONTypeFields?.forEach((replace) => {
						if (node.name.value.match(replace.fieldName)) {
							insideJSONField = true;
							replaceJSONType = replace;
							replaceWith = replace.inputTypeReplacement;
						}
					});
				}
			},
			leave: (_) => {
				insideJSONField = false;
			},
		},
		NamedType: (node) => {
			if (insideJSONField && insideJSONType && replaceJSONType) {
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
