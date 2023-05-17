import {
	GraphQLInputType,
	GraphQLOutputType,
	GraphQLNonNull,
	GraphQLList,
	GraphQLScalarType,
	GraphQLNamedType,
	GraphQLEnumType,
	GraphQLInputObjectType,
	ASTNode,
	Kind,
	OperationTypeNode,
} from 'graphql';

export function toUpper(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

export function toLower(word: string): string {
	return word.charAt(0).toLowerCase() + word.slice(1);
}

export function inputType(type: GraphQLInputType): GraphQLInputType {
	if (type instanceof GraphQLNonNull) {
		return inputType(type.ofType);
	} else if (type instanceof GraphQLList) {
		return inputType(type.ofType);
	} else {
		return type;
	}
}

export function outputType(type: GraphQLOutputType): GraphQLOutputType {
	if (type instanceof GraphQLNonNull) {
		return outputType(type.ofType);
	} else if (type instanceof GraphQLList) {
		return outputType(type.ofType);
	} else {
		return type;
	}
}

export function listType(type: GraphQLOutputType | GraphQLInputType): boolean {
	if (type instanceof GraphQLNonNull) {
		return listType(type.ofType);
	} else if (type instanceof GraphQLList) {
		return true;
	} else {
		return false;
	}
}

export const toPrimitive = (scalar: GraphQLScalarType): 'number' | 'string' | 'boolean' => {
	switch (scalar.name) {
		case 'ID':
		case 'String':
			return 'string';
		case 'Boolean':
			return 'boolean';
		case 'Int':
		case 'Float':
			return 'number';
		default:
			return 'string';
	}
};

export const printType = (type: GraphQLNamedType) => {
	if (type instanceof GraphQLScalarType) {
		return `${type.name}: ${toPrimitive(type)}`;
	} else if (type instanceof GraphQLEnumType) {
		return `${type.name}: ${type.name}`;
	} else {
		return `${type.name}: ${type.name}`;
	}
};

export const printInputType = (type: GraphQLInputType): string => {
	const isList = listType(type);
	const base = inputType(type);

	return (
		(() => {
			if (base instanceof GraphQLScalarType) {
				return toPrimitive(base);
			} else if (base instanceof GraphQLEnumType) {
				return base.name;
			} else if (base instanceof GraphQLInputObjectType) {
				return base.name;
			} else {
				throw new Error('Unable to render inputType.');
			}
		})() + (isList ? '[]' : '')
	);
};

export const stringifyAST = (ast: ASTNode) => {
	const acc: string[] = [];
	accumulateASTNode(ast, acc);
	return acc.join('\n');
};

const reverseRecord = <TRecord extends Record<string, string>>(input: TRecord) =>
	Object.fromEntries(Object.entries(input).map(([k, v]) => [v, k]));

const kindRevMapping = reverseRecord(Kind);
const operationTypeRevMapping = reverseRecord(OperationTypeNode);

const accumulateASTNode = (astNode: ASTNode, acc: string[]) => {
	acc.push('{');
	for (const [k, v] of Object.entries(astNode)) {
		if (v === undefined) continue;
		acc.push(`${JSON.stringify(k)}: `);
		if (Array.isArray(v)) {
			acc.push(`[`);
			for (const childNode of v) {
				accumulateASTNode(childNode, acc);
				acc.push(',');
			}
			acc.push(']');
		} else if (typeof v === 'object' && typeof v.kind === 'string') {
			accumulateASTNode(v, acc);
		} else if (k === 'kind' && kindRevMapping[v]) {
			acc.push(`Kind.${kindRevMapping[v]}`);
		} else if (k === 'operation' && operationTypeRevMapping[v]) {
			acc.push(`OperationTypeNode.${operationTypeRevMapping[v]}`);
		} else {
			acc.push(JSON.stringify(v));
		}
		acc.push(',');
	}
	acc.push('}');
};
