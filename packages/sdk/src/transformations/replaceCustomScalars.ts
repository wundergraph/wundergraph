import { GraphQLIntrospection, OpenAPIIntrospection, ReplaceCustomScalarTypeFieldConfiguration } from '../definition';
import { FieldDefinitionNode, InputValueDefinitionNode, parse, print, visit } from 'graphql';
import { SingleTypeField } from '@wundergraph/protobuf';

export interface ReplaceCustomScalarsResult {
	schemaSDL: string;
	customScalarTypeFields: SingleTypeField[];
	customScalarTypeNames: string[];
}

export const replaceCustomScalars = (
	schemaSDL: string,
	introspection: GraphQLIntrospection | OpenAPIIntrospection
): ReplaceCustomScalarsResult => {
	const replacements = introspection.replaceCustomScalarTypeFields;
	if (!replacements || replacements.length < 1) {
		return { schemaSDL, customScalarTypeFields: [], customScalarTypeNames: [] };
	}
	const replacementsByParentName = getCustomScalarReplacementsByParent(replacements);
	const replacementsByInterfaceName = new Map<string, Map<string, string>>();
	let currentParentInterfaces: string[] = [];
	let currentValidParentTypeName = '';
	let customScalarReplacementName = '';
	const replacementScalars = new Set<SingleTypeField>();
	const replacementScalarTypeNames = new Set<string>();

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
				customScalarReplacementName = handleScalarReplacementForChild(
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
				customScalarReplacementName = '';
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
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
				customScalarReplacementName = '';
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				customScalarReplacementName = handleScalarReplacementForChild(
					node,
					replacementsByParentName,
					currentValidParentTypeName,
					replacementScalars,
					replacementScalarTypeNames
				);
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
		return {
			schemaSDL: schema,
			customScalarTypeFields: Array.from(replacementScalars),
			customScalarTypeNames: Array.from(replacementScalarTypeNames),
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
				customScalarReplacementName = '';
			},
		},
		FieldDefinition: {
			enter: (node) => {
				// Interfaces will have the same fields as objects, so need to attempt to add to replacementScalarTypeNames
				customScalarReplacementName = handleScalarReplacementForChild(
					node,
					replacementsByInterfaceName,
					currentValidParentTypeName,
					replacementScalars
				);
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

	return {
		schemaSDL: schema,
		customScalarTypeFields: Array.from(replacementScalars),
		customScalarTypeNames: Array.from(replacementScalarTypeNames),
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
	if (replacementScalarTypeNames) {
		replacementScalarTypeNames.add(replacementScalarName);
	}
	return replacementScalarName;
};
