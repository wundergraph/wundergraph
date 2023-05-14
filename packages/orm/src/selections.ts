import type { Fn, Objects, Booleans, Call, Pipe, Unions } from 'hotscript';
import type { Primitive, EmptyObject, SetOptional } from 'type-fest';
import {
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLEnumType,
	GraphQLInterfaceType,
	GraphQLUnionType,
	getNamedType,
	isScalarType,
	type GraphQLType,
	type GraphQLOutputType,
	type GraphQLSchema,
	SelectionSetNode,
	TypeInfo,
	visit,
	visitWithTypeInfo,
	BREAK,
	InterfaceTypeDefinitionNode,
	UnionTypeDefinitionNode,
} from 'graphql';
import { field, selectionSet, type Field, type SelectionSet } from '@timkendall/tql';

import {
	NamedType,
	fieldRequiresArguments,
	type FieldRequiresArguments,
	type ArgumentsFromField,
	type FieldHasArguments,
} from './definition';
import { ToSelectionSet } from './paths';

const TYPENAME_SELECTION = field('__typename');

export const selectable = (type: GraphQLOutputType): boolean =>
	type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType;

export type AllScalars<Type extends object> = {
	[FieldName in keyof Type]: Type[FieldName] extends (...args: any[]) => infer T
		? NonNullable<T> extends Primitive
			? Field<Extract<FieldName, string>>
			: never
		: never;
}[keyof Type];

export const allScalars = (type: GraphQLObjectType | GraphQLInterfaceType): SelectionSet<any> =>
	selectionSet(
		Object.values(type.getFields())
			.filter(({ type }) => isScalarType(getNamedType(type)))
			.map(({ name }) => field(name))
	);

// @todo modify to select all interface fields
export type DefaultSelection<Type extends object> = Type extends {
	__abstract: true;
}
	? SelectionSet<[Field<'__typename'>]>
	: SelectionSet<Array<AllScalars<Type>>>;

export const defaultSelection = (type: GraphQLOutputType): SelectionSet<any> | undefined => {
	if (type instanceof GraphQLScalarType || type instanceof GraphQLEnumType) {
		return undefined;
	} else if (type instanceof GraphQLObjectType) {
		return allScalars(type);
	} else if (type instanceof GraphQLInterfaceType) {
		return selectionSet([TYPENAME_SELECTION, ...allScalars(type).selections]);
	} else if (type instanceof GraphQLUnionType) {
		return selectionSet([TYPENAME_SELECTION]);
	} else {
		throw new Error(`Unable to build default selection for type "${type}".`);
	}
};

type InferName<F> = F extends Field<infer Name, any, any, infer AliasName>
	? AliasName extends string
		? AliasName
		: Name
	: never;

export type SelectionRequiresArguments<
	Schema,
	Type extends Record<string, any>,
	Set extends SelectionSet<any>
> = Set['selections'][number] extends infer Selection
	? FieldRequiresArguments<Type[InferName<Selection>]> extends true
		? true // no need to traverse further
		: Selection extends Field<infer Name, any, infer NestedSelections extends SelectionSet<any>> // if nested
		? SelectionRequiresArguments<Schema, ReturnType<Type[Name]>, NestedSelections> // traverse if needed
		: false
	: never;

export const selectionRequiresArguments = <Schema, Type, SelectionSet>(
	schema: GraphQLSchema,
	initialType: GraphQLType,
	selectionSet: SelectionSetNode
): boolean => {
	const typeInfo = new TypeInfo(schema, initialType);

	let _accepts = false;
	const visitor = visitWithTypeInfo(typeInfo, {
		Field(_) {
			const fieldDefinition = typeInfo.getFieldDef();

			if (fieldDefinition && fieldRequiresArguments(fieldDefinition)) {
				_accepts = true;
				return BREAK;
			}

			// if (fieldDefinition && fieldDefinition.args.length > 0) {
			//   _accepts = true
			//   return BREAK
			// }
		},
	});

	visit(selectionSet, visitor);

	return _accepts;
};

interface OmitEmpty extends Fn {
	return: this['arg0'] extends EmptyObject ? never : this['arg0'];
}

/**
 * Optional objects are objects whos every key is optional (e.g `{ lang?: string | undefined }`)
 */

interface IsOptional extends Fn {
	return: undefined extends this['arg0'] ? true : false;
}

// is it an object with all optional keys
interface IsOptionalObject extends Fn {
	return: Pipe<this['arg0'], [Objects.OmitBy<IsOptional>, Booleans.Extends<EmptyObject>]>;
}

// get all fields that are optional objects
interface KeysOfOptionalObjects extends Fn {
	return: Pipe<
		this['arg0'],
		[Objects.PickBy<Booleans.Extends<object>>, Objects.PickBy<IsOptionalObject>, Objects.Keys]
	>;
}
interface SetOptionalFields extends Fn {
	return: SetOptional<this['arg0'], Call<KeysOfOptionalObjects, this['arg0']>>;
}

// @note gross but works for unions (e.g `SelectionSet<ReadonlyArray<Field<'a'> | Field<'b'>>>)
// @todo rewrite this to correctly filter undefined and empty objects
export type ArgumentDefinitions<Schema, Type extends Record<string, any>, Selections extends SelectionSet<any>> = Pipe<
	{
		[Selection in Selections['selections'][number] as InferName<Selection>]: (
			Selection extends Field<infer Name, any /* args */, infer NestedSelection extends SelectionSet<any>>
				? FieldHasArguments<Type[Name]> extends true
					? Pipe<
							ArgumentsFromField<Type[Name]>,
							[
								Objects.Assign<ArgumentDefinitions<Schema, NonNullable<ReturnType<Type[Name]>>, NestedSelection>>,
								OmitEmpty
							]
					  >
					: ArgumentDefinitions<Schema, NamedType<NonNullable<ReturnType<Type[Name]>>>, NestedSelection>
				: ArgumentsFromField<Type[InferName<Selection>]>
		) extends infer V
			? V extends EmptyObject
				? undefined
				: V
			: never;
	},
	[Objects.OmitBy<Booleans.Equals<undefined>>, SetOptionalFields]
>;

// @todo make recursive
export type AbstractTypesInSelection<
	Schema,
	Type extends Record<string, any>,
	Selections extends SelectionSet<any>
> = Selections['selections'][number] extends Field<infer Name>
	? // @todo use `NamedType` once properly implemented
	  NonNullable<ReturnType<Type[Name]>> extends {
			__abstract: true;
			__possibleTypes: [...infer Types];
	  }
		? Types[number] extends { __typename(): infer T }
			? T
			: never
		: never
	: never;

// conditional mapping
interface ToExpanded<Type extends Record<string, any>> extends Fn {
	return: this['arg0'] extends Field<infer Name>
		? // @todo handled fields with selection sets to support auto-selecting N nested object fields
		  NamedType<NonNullable<ReturnType<Type[Name]>>> extends infer NestedType extends object
			? Field<Name, never /* @todo pass through args*/, DefaultSelection<NestedType>>
			: this['arg0']
		: this['arg0'];
}

export type ExpandSelectionSet<
	Type extends Record<string, any>,
	Selections extends SelectionSet<ReadonlyArray<any>>
> = SelectionSet<ReadonlyArray<Pipe<Selections['selections'][number], [Unions.Map<ToExpanded<Type>>]>>>;

export const expandSelection = (
	schema: GraphQLSchema,
	type: GraphQLObjectType,
	selectionSet: SelectionSetNode
): SelectionSetNode => {
	const typeInfo = new TypeInfo(schema, type);
	const visitor = visitWithTypeInfo(typeInfo, {
		Field(node) {
			const fieldType = typeInfo.getType();
			if (!fieldType) {
				console.warn(`expandSelection: unable to determine field type.`);
				return;
			}

			const unwrappedType = getNamedType(fieldType);
			// @todo interface type common fields
			if (unwrappedType instanceof GraphQLObjectType && !node.selectionSet?.selections.length) {
				return field(node.name.value, undefined /* @todo passthrough args*/, defaultSelection(unwrappedType));
			}
		},
	});

	return visit(selectionSet, visitor);
};
