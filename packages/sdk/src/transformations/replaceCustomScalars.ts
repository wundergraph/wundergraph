import { GraphQLIntrospection, OpenAPIIntrospection, ReplaceCustomScalarTypeFieldConfiguration } from '../definition';
import { FieldDefinitionNode, InputValueDefinitionNode, parse, print, visit } from 'graphql';
import { SingleTypeField } from '@wundergraph/protobuf';

export interface ReplaceCustomScalarsResult {
	schemaSDL: string;
	customScalarTypeFields: SingleTypeField[];
	customScalarTypeNames: Set<string>;
}

export const replaceCustomScalars = (
	schemaSDL: string,
	introspection: GraphQLIntrospection | OpenAPIIntrospection
): ReplaceCustomScalarsResult => {
	const replacements = introspection.replaceCustomScalarTypeFields;
	if (!replacements || replacements.length < 1) {
		return { schemaSDL, customScalarTypeFields: [], customScalarTypeNames: new Set<string>() };
	}
	const replacementsByParentName = getCustomScalarReplacementsByParent(replacements);
	const replacementsByInterfaceName = new Map<string, Map<string, string>>();
	const replacementScalars = new Set<SingleTypeField>();
	const replacementScalarTypeNames = new Set<string>();
	let currentParentInterfaces: string[] = [];
	let currentValidParentTypeName = '';
	let customScalarReplacementTypeNameForField = '';
	let customScalarReplacementTypeNameForInputValue = '';
	let isParentInputObjectType = false;
	let isInputValue = false;
	let isArgument = false;

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
				customScalarReplacementTypeNameForField = '';
				currentParentInterfaces = [];
			},
		},
		FieldDefinition: {
			enter: (node) => {
				customScalarReplacementTypeNameForField = handleScalarReplacementForChild(
					node,
					replacementsByParentName,
					currentValidParentTypeName,
					replacementScalars,
					replacementScalarTypeNames,
					currentParentInterfaces,
					replacementsByInterfaceName
				);
			},
			leave: (_) => {
				customScalarReplacementTypeNameForField = '';
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
				isParentInputObjectType = true;
				const nodeName = node.name.value;
				if (replacementsByParentName.get(nodeName)) {
					currentValidParentTypeName = nodeName;
				} else {
					// Skip this parent
					return false;
				}
			},
			leave: (_) => {
				currentValidParentTypeName = '';
				customScalarReplacementTypeNameForInputValue = '';
				isParentInputObjectType = false;
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				// If the parent is not an input object, this input value definition must be an argument
				// Support for renaming arguments is possible but not yet implemented, so skip the field
				if (!isParentInputObjectType) {
					return false;
				}
				// If we're already inside an input value field on the parent input object, this must be an argument
				// Support for renaming arguments it's possible but not yet implemented, so skip the field
				if (isInputValue) {
					isArgument = true;
					return false;
				} else {
					isInputValue = true;
				}
				customScalarReplacementTypeNameForInputValue = handleScalarReplacementForChild(
					node,
					replacementsByParentName,
					currentValidParentTypeName,
					replacementScalars,
					replacementScalarTypeNames
				);
			},
			leave: (_) => {
				customScalarReplacementTypeNameForInputValue = '';
				// If isArgument is true, the visitor has just left an argument
				if (isArgument) {
					isArgument = false;
					return;
				}
				// If isArgument is false, the visitor just left an input value field
				isInputValue = false;
			},
		},
		NamedType: (node) => {
			// Argument replacement is not currently possible
			if (isArgument) {
				return false;
			}
			if (customScalarReplacementTypeNameForInputValue) {
				return { ...node, name: { ...node.name, value: customScalarReplacementTypeNameForInputValue } };
			}
			if (customScalarReplacementTypeNameForField) {
				return { ...node, name: { ...node.name, value: customScalarReplacementTypeNameForField } };
			}
		},
	});

	if (replacementsByInterfaceName.size < 1) {
		const schema = print(astWithReplacements);
		return {
			schemaSDL: schema,
			customScalarTypeFields: Array.from(replacementScalars),
			customScalarTypeNames: replacementScalarTypeNames,
		};
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
				customScalarReplacementTypeNameForField = '';
			},
		},
		FieldDefinition: {
			enter: (node) => {
				// Interfaces will have the same fields as objects, so need to attempt to add to replacementScalarTypeNames
				customScalarReplacementTypeNameForField = handleScalarReplacementForChild(
					node,
					replacementsByInterfaceName,
					currentValidParentTypeName,
					replacementScalars
				);
			},
			leave: (_) => {
				customScalarReplacementTypeNameForField = '';
			},
		},
		NamedType: (node) => {
			if (customScalarReplacementTypeNameForField) {
				return { ...node, name: { ...node.name, value: customScalarReplacementTypeNameForField } };
			}
		},
	});

	const schema = print(astWithInterfaceReplacements);

	return {
		schemaSDL: schema,
		customScalarTypeFields: Array.from(replacementScalars),
		customScalarTypeNames: replacementScalarTypeNames,
	};
};

export type ReplacementScalarMap = Map<string, Map<string, string>>;

export const getCustomScalarReplacementsByParent = (
	replacements: ReplaceCustomScalarTypeFieldConfiguration[]
): ReplacementScalarMap => {
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

const addToOrInitializeMap = (
	map: ReplacementScalarMap,
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

export const handleScalarReplacementForChild = (
	node: FieldDefinitionNode | InputValueDefinitionNode,
	replacementScalarMap: ReplacementScalarMap,
	currentValidParentTypeName: string,
	replacementScalars: Set<SingleTypeField>,
	replacementScalarTypeNames?: Set<string>,
	currentParentInterfaces?: string[],
	replacementsByInterfaceName?: ReplacementScalarMap
): string => {
	const fieldName = node.name.value;
	const replacementScalarName = replacementScalarMap.get(currentValidParentTypeName)?.get(fieldName);
	// If no change is required, ignore
	const typeName = 'name' in node.type ? node.type.name.value : '';
	if (!replacementScalarName || typeName === replacementScalarName) {
		return '';
	}
	if (currentParentInterfaces && replacementsByInterfaceName) {
		// We don't know which interface the field belongs to, if any, so add to them all
		for (const interfaceName of currentParentInterfaces) {
			addToOrInitializeMap(replacementsByInterfaceName, interfaceName, fieldName, replacementScalarName);
		}
	}
	replacementScalars.add({ typeName: currentValidParentTypeName, fieldName: fieldName });
	// Remove the brackets and exclamation marks to get the root type
	const replacementScalarRootTypeName = replacementScalarName.replaceAll(/[\[!\]]/g, '');
	if (replacementScalarTypeNames) {
		replacementScalarTypeNames.add(replacementScalarRootTypeName);
	}
	return replacementScalarName;
};
