import { L, Test } from 'ts-toolbelt';

import type { Field, InlineFragment, NamedType, Selection, SelectionSet } from '@timkendall/tql';

// @todo rebuild type-system AST logic ontop of generic visitor implementations
// `Visit<Visitor extends ASTVisitor>`
// type MyVisitor = VisitWithTypeInfo<TypeInfo, { Field: }

export type Result<
	Schema extends Record<string, any>,
	Parent,
	Selected extends SelectionSet<ReadonlyArray<Selection>> | undefined
> =
	// Lists
	Parent extends Array<infer T> | ReadonlyArray<infer T>
		? ReadonlyArray<Result<Schema, T, Selected>>
		: // Objects
		Parent extends Record<string, any>
		? Selected extends SelectionSet<ReadonlyArray<Selection>>
			? HasInlineFragment<Selected> extends Test.Pass
				? SpreadFragments<Schema, Selected>
				: {
						// @todo cleanup mapped typed field name mapping
						readonly [F in Selected['selections'][number] as InferName<F>]: InferResult<F, Schema, Parent>;
				  }
			: never
		: // Scalars
		  Parent;

type InferName<F> = F extends Field<infer Name, any, any, infer AliasName>
	? AliasName extends string
		? AliasName
		: Name
	: never;

type InferResult<F, Schema extends Record<string, any>, Parent extends Record<string, any>> = F extends Field<
	infer Name,
	any,
	infer SS,
	any
>
	? Result<Schema, InferParent<Parent, Name>, SS>
	: never;

/* @note support parameterized fields */
type InferParent<Parent extends Record<string, any>, Name extends string> = Parent[Name] extends (
	variables: any
) => infer T
	? T
	: Parent[Name];

export type SpreadFragments<
	Schema extends Record<string, any>,
	Selected extends SelectionSet<ReadonlyArray<Selection>>
> = Selected['selections'][number] extends infer Selection
	? Selection extends InlineFragment<any, any>
		? SpreadFragment<
				Schema,
				Selection,
				SelectionSet<L.Filter<Selected['selections'], InlineFragment<any, any>>> // @bug are we are losing inference here since `SelectionSet<[Field<'id'>]>` works?
		  >
		: never
	: never;

export type SpreadFragment<
	Schema extends Record<string, any>,
	Fragment extends InlineFragment<any, any>,
	CommonSelection extends SelectionSet<ReadonlyArray<Field<any, any, any, any>>>
> = Fragment extends InlineFragment<NamedType<infer Typename>, infer SelectionSet>
	? Result<Schema, Schema[Typename], MergeSelectionSets<SelectionSet, CommonSelection>>
	: never;

export type MergeSelectionSets<
	A extends SelectionSet<ReadonlyArray<Selection>>,
	B extends SelectionSet<ReadonlyArray<Selection>>
> = SelectionSet<[...A['selections'], ...B['selections']]>;

type HasInlineFragment<T extends SelectionSet<any> | undefined> = T extends SelectionSet<infer Selections>
	? L.Includes<Selections, InlineFragment<any, any>>
	: never;

type Merge<M, N> = Omit<M, keyof N> & N;
