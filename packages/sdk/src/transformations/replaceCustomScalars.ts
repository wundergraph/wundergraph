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
	const replacements = introspection.replaceCustomScalarTypeFields;
	if (!replacements || replacements.length < 1) {
		return { schemaSDL, customScalarTypeFields: [] };
	}
	const replacementsByParentName = getCustomScalarReplacementsByParent(replacements);
	const replacementsByInterfaceName = new Map<string, Map<string, string>>();
	let currentParentInterfaces: string[] = [];
	let currentValidParentTypeName = '';
	let customScalarReplacementName = '';
	const replacementScalars: Set<SingleTypeField> = new Set<SingleTypeField>();

	const ast = parse(schemaSDL);
	const astWithReplacements = visit(ast, {
		ObjectTypeDefinition: {
			enter: (node) => {
				if (replacementsByParentName.get(node.name.value)) {
					const interfaces = node.interfaces;
					if (interfaces) {
						// Keep record of the implemented interfaces until a scalar is replaced
						currentParentInterfaces = interfaces.map((i) => i.name.value);
					}
					currentValidParentTypeName = node.name.value;
				} else {
					// Skip this parent
					return false;
				}
			},
			leave: (_) => {
				currentValidParentTypeName = '';
				customScalarReplacementName = '';
				currentParentInterfaces = [];
			},
		},
		FieldDefinition: {
			enter: (node) => {
				const fieldName = node.name.value;
				const replacementScalarName = replacementsByParentName.get(currentValidParentTypeName)?.get(fieldName);
				// If no change is required, ignore
				const typeName = 'name' in node.type ? node.type.name.value : '';
				if (!replacementScalarName || typeName === replacementScalarName) {
					return;
				}
				// We don't know which interface the field belongs to, if any, so add to them all
				for (const interfaceName of currentParentInterfaces) {
					addToOrInitializeMap(replacementsByInterfaceName, interfaceName, fieldName, replacementScalarName);
				}
				customScalarReplacementName = replacementScalarName;
				replacementScalars.add({ typeName: currentValidParentTypeName, fieldName: fieldName });
			},
			leave: (_) => {
				customScalarReplacementName = '';
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
				if (replacementsByParentName.get(node.name.value)) {
					currentValidParentTypeName = node.name.value;
				} else {
					// Skip this parent
					return false;
				}
			},
			leave: (_) => {
				currentValidParentTypeName = '';
				customScalarReplacementName = '';
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				const fieldName = node.name.value;
				const replacementScalarName = replacementsByParentName.get(currentValidParentTypeName)?.get(fieldName);
				// If no change is required, ignore
				const typeName = 'name' in node.type ? node.type.name.value : '';
				if (!replacementScalarName || typeName === replacementScalarName) {
					return;
				}
				customScalarReplacementName = replacementScalarName;
				replacementScalars.add({
					typeName: currentValidParentTypeName,
					fieldName: fieldName,
				});
			},
			leave: (_) => {
				customScalarReplacementName = '';
			},
		},
		NamedType: (node) => {
			if (customScalarReplacementName) {
				return { ...node, name: { ...node.name, value: customScalarReplacementName } };
			}
		},
	});

	if (replacementsByInterfaceName.size < 1) {
		const schema = print(astWithReplacements);
		return { schemaSDL: schema, customScalarTypeFields: Array.from(replacementScalars) };
	}

	const astWithInterfaceReplacements = visit(astWithReplacements, {
		InterfaceTypeDefinition: {
			enter: (node) => {
				if (replacementsByInterfaceName.get(node.name.value)) {
					currentValidParentTypeName = node.name.value;
				} else {
					// Skip this parent
					return false;
				}
			},
			leave: (_) => {
				currentValidParentTypeName = '';
				customScalarReplacementName = '';
			},
		},
		FieldDefinition: {
			enter: (node) => {
				const replacementScalarName = replacementsByInterfaceName.get(currentValidParentTypeName)?.get(node.name.value);
				// If no change is required, ignore
				const typeName = 'name' in node.type ? node.type.name.value : '';
				if (!replacementScalarName || typeName === replacementScalarName) {
					return;
				}
				customScalarReplacementName = replacementScalarName;
				replacementScalars.add({ typeName: currentValidParentTypeName, fieldName: node.name.value });
			},
			leave: (_) => {
				customScalarReplacementName = '';
			},
		},
		NamedType: (node) => {
			if (customScalarReplacementName) {
				return { ...node, name: { ...node.name, value: customScalarReplacementName } };
			}
		},
	});

	const schema = print(astWithInterfaceReplacements);

	return { schemaSDL: schema, customScalarTypeFields: Array.from(replacementScalars) };
};

export const getCustomScalarReplacementsByParent = (
	replacements: ReplaceCustomScalarTypeFieldConfiguration[]
): Map<string, Map<string, string>> => {
	const replacementsByParent = new Map<string, Map<string, string>>();
	replacements.forEach((replacement) => {
		addToOrInitializeMap(
			replacementsByParent,
			replacement.entityName,
			replacement.fieldName,
			replacement.responseTypeReplacement
		);
	});
	return replacementsByParent;
};

export const addToOrInitializeMap = (
	map: Map<string, Map<string, string>>,
	typeName: string,
	fieldName: string,
	replacementScalarName: string
) => {
	const entry = map.get(typeName);
	if (entry) {
		entry.set(fieldName, replacementScalarName);
	} else {
		map.set(typeName, new Map<string, string>([[fieldName, replacementScalarName]]));
	}
};
