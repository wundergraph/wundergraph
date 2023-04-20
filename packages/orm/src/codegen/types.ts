import {
	GraphQLSchema,
	ASTVisitor,
	Kind,
	GraphQLArgument,
	isNonNullType,
	GraphQLField,
	GraphQLObjectType,
	GraphQLInputObjectType,
	GraphQLInputType,
	GraphQLNonNull,
	GraphQLScalarType,
	GraphQLEnumType,
	GraphQLUnionType,
	GraphQLInterfaceType,
	DocumentNode,
	GraphQLInputField,
} from 'graphql';
import { code } from 'ts-poet';
import { invariant } from 'outvariant';

import { inputType, outputType, listType, toPrimitive, printInputType } from './utils';

const printVariable = (arg: GraphQLArgument): string => {
	const isOptional = !(arg.type instanceof GraphQLNonNull);
	return `${arg.name}${isOptional ? '?' : ''}: ${printInputType(arg.type)}`;
};

const printField = (field: GraphQLField<any, any, any>): string => {
	const { args } = field;

	const isList = listType(field.type);
	const isNonNull = field.type instanceof GraphQLNonNull;
	const type = outputType(field.type);

	const printVariables = () => {
		return args.length > 0 ? `(variables: { ${args.map(printVariable).join(', ')} })` : '()';
	};

	if (type instanceof GraphQLScalarType) {
		return (
			`${field.name}${printVariables()}: ${isList ? `ReadonlyArray<${toPrimitive(type)}>` : `${toPrimitive(type)}`}` +
			(isNonNull ? '' : ' | null')
		);
	} else if (type instanceof GraphQLEnumType) {
		return (
			`${field.name}${printVariables()}: ${isList ? `ReadonlyArray<${type.name}>` : `${type.name}`}` +
			(isNonNull ? '' : ' | null')
		);
	} else if (
		type instanceof GraphQLInterfaceType ||
		type instanceof GraphQLUnionType ||
		type instanceof GraphQLObjectType
	) {
		return (
			`${field.name}${printVariables()}: ${isList ? `ReadonlyArray<${type.name}>` : `${type.name}`}` +
			(isNonNull ? '' : ' | null')
		);
	} else {
		throw new Error('Unable to print field.');
	}
};

export const transform = (ast: DocumentNode, schema: GraphQLSchema): ASTVisitor => {
	// @note needed to serialize inline enum values correctly at runtime
	const enumValues = new Set<string>();

	return {
		[Kind.DIRECTIVE_DEFINITION]: () => null,

		[Kind.SCALAR_TYPE_DEFINITION]: () => null,

		[Kind.ENUM_TYPE_DEFINITION]: (node) => {
			const typename = node.name.value;
			const values = node.values?.map((v) => v.name.value) ?? [];

			const printMember = (member: string): string => {
				return `"${member}"`;
			};

			return code`
        export type ${typename} = ${values.map(printMember).join(' | ')}
      `;
		},

		[Kind.ENUM_VALUE_DEFINITION]: (node) => {
			enumValues.add(node.name.value);
			return null;
		},

		[Kind.INPUT_OBJECT_TYPE_DEFINITION]: (node) => {
			const typename = node.name.value;
			const type = schema.getType(typename);

			invariant(
				type instanceof GraphQLInputObjectType,
				`Type "${typename}" was not instance of expected class GraphQLInputObjectType.`
			);

			const fields = Object.values(type.getFields());

			const printField = (field: GraphQLInputField) => {
				const isList = listType(field.type);
				const isNonNull = isNonNullType(field.type);
				const baseType = inputType(field.type);

				let tsType: string;

				if (baseType instanceof GraphQLScalarType) {
					tsType = toPrimitive(baseType);
				} else if (baseType instanceof GraphQLEnumType) {
					tsType = baseType.name;
				} else if (baseType instanceof GraphQLInputObjectType) {
					tsType = baseType.name;
				} else {
					throw new Error('Unable to render inputField!');
				}

				return [field.name, isNonNull ? ':' : '?:', ' ', tsType, isList ? '[]' : ''].join('');
			};

			return code`
        export interface ${typename} {
          ${fields.map(printField).join('\n')}
        }
      `;
		},

		[Kind.OBJECT_TYPE_DEFINITION]: (node) => {
			const typename = node.name.value;
			const type = schema.getType(typename);

			invariant(
				type instanceof GraphQLObjectType,
				`Type "${typename}" was not instance of expected class GraphQLObjectType.`
			);

			const fields = Object.values(type.getFields());
			const interfaces = type.getInterfaces();

			// @note TypeScript only requires new fields to be defined on interface extendors
			const interfaceFields = interfaces.flatMap((i) => Object.values(i.getFields()).map((field) => field.name));
			const uncommonFields = fields.filter((field) => !interfaceFields.includes(field.name));

			// @todo extend any implemented interfaces
			// @todo only render fields unique to this type
			const extensions = interfaces.length > 0 ? `extends ${interfaces.map((i) => i.name).join(', ')}` : '';

			return code`
        export interface ${typename} {
          __typename(): ${`"${typename}"`}
          ${fields.map(printField).join('\n')}
        }
      `;
		},

		[Kind.INTERFACE_TYPE_DEFINITION]: (node) => {
			const typename = node.name.value;
			const type = schema.getType(typename);

			invariant(
				type instanceof GraphQLInterfaceType,
				`Type "${typename}" was not instance of expected class GraphQLInterfaceType.`
			);

			// @note Get all implementors of this union
			const implementations = schema.getPossibleTypes(type).map((type) => type.name);

			const fields = Object.values(type.getFields());

			return code`
        export interface ${typename} {
          __typename(): ${implementations.map((type) => `"${type}"`).join(' | ')}
					__abstract: true
	        __possibleTypes: [${implementations.join(',')}]
          ${fields.map(printField).join('\n')}
        }
      `;
		},

		[Kind.UNION_TYPE_DEFINITION]: (node) => {
			const typename = node.name.value;
			const type = schema.getType(typename);

			invariant(
				type instanceof GraphQLUnionType,
				`Type "${typename}" was not instance of expected class GraphQLUnionType.`
			);

			// @note Get all implementors of this union
			const implementations = schema.getPossibleTypes(type).map((type) => type.name);

			return code`
        export interface ${type.name} {
          __typename(): ${implementations.map((typename) => `"${typename}"`).join(' | ')}
          __abstract: true
	        __possibleTypes: [${implementations.join(',')}]
        }
      `;
		},

		[Kind.SCHEMA_DEFINITION]: (_) => {
			return null;
		},
	};
};
