import { RenameType, RenameTypeField } from '../definition';
import { FieldDefinitionNode, Kind, parse, print, visit } from 'graphql';

export const renameTypeFields = (schema: string, rename: RenameTypeField[]): string => {
	const document = parse(schema);
	let currentTypeName: undefined | string;
	const transformed = visit(document, {
		ObjectTypeDefinition: {
			enter: (node) => {
				currentTypeName = node.name.value;
			},
			leave: (node) => {
				currentTypeName = undefined;
			},
		},
		InterfaceTypeDefinition: {
			enter: (node) => {
				currentTypeName = node.name.value;
			},
			leave: (node) => {
				currentTypeName = undefined;
			},
		},
		FieldDefinition: (node, key, parent) => {
			const re = rename.find((re) => re.typeName === currentTypeName && re.fromFieldName === node.name.value);
			if (re !== undefined) {
				const replacement: FieldDefinitionNode = {
					...node,
					name: {
						kind: Kind.NAME,
						value: re.toFieldName,
					},
				};
				return replacement;
			}
		},
	});
	return print(transformed);
};

export const renameTypes = (schema: string, rename: RenameType[]): string => {
	const document = parse(schema);
	const transformed = visit(document, {
		ObjectTypeDefinition: (node) => {
			const mod = rename.find((re) => re.from === node.name.value);
			if (!mod) {
				return;
			}
			return {
				...node,
				name: {
					kind: 'Name',
					value: mod.to,
				},
			};
		},
		InterfaceTypeDefinition: (node) => {
			const mod = rename.find((re) => re.from === node.name.value);
			if (!mod) {
				return;
			}
			return {
				...node,
				name: {
					kind: 'Name',
					value: mod.to,
				},
			};
		},
		UnionTypeDefinition: (node) => {
			const mod = rename.find((re) => re.from === node.name.value);
			if (!mod) {
				return;
			}
			return {
				...node,
				name: {
					kind: 'Name',
					value: mod.to,
				},
			};
		},
		NamedType: (node) => {
			const mod = rename.find((re) => re.from === node.name.value);
			if (!mod) {
				return;
			}
			return {
				...node,
				name: {
					kind: 'Name',
					value: mod.to,
				},
			};
		},
	});
	return print(transformed);
};
