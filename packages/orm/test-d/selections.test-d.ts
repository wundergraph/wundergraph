import { expectType } from 'tsd';
import type { Field, SelectionSet } from '@timkendall/tql';

import type { FieldHasArguments } from '../src/definition';
import type { SelectionRequiresArguments, ArgumentDefinitions } from '../src/selections';

// @todo our runtime `selectionRequiresArguments` implementation should have this signature
declare const selectionRequiresArguments: {
	<Schema, Type extends Record<string, any>, SS extends SelectionSet<any>>(
		schema: Schema,
		initialType: Type,
		selectionSet: SS
	): SelectionRequiresArguments<Schema, Type, SS>;
};

interface Schema {
	Query: Query;
	Nested: Nested;
}

interface Query {
	foo(): boolean;
	bar(variables: { optional?: string }): boolean;
	baz(variables: { required: string }): boolean;
	nested(): Nested;
}

interface Nested {
	foo(): boolean;
	bar(variables: { optional?: string }): boolean;
	baz(variables: { required: string }): boolean;
	nested2(): Nested2;
}

interface Nested2 {
	args(variables: { required: boolean }): boolean;
	none(): boolean;
}

const schema = {} as Schema;
const type = {} as Query;

//
// `SelectionRequiresArguments`
//

// Root Selections

const selectionSet1 = {} as SelectionSet<[Field<'foo'>]>;
expectType<false>(selectionRequiresArguments(schema, type, selectionSet1));

const selectionSet2 = {} as SelectionSet<[Field<'bar'>]>;
expectType<false>(selectionRequiresArguments(schema, type, selectionSet2));

const selectionSet3 = {} as SelectionSet<[Field<'baz'>]>;
expectType<true>(selectionRequiresArguments(schema, type, selectionSet3));

// Nested Selections

const selectionSet4 = {} as SelectionSet<[Field<'nested', undefined, SelectionSet<[Field<'foo'>]>>]>;
expectType<false>(selectionRequiresArguments(schema, type, selectionSet4));

const selectionSet5 = {} as SelectionSet<[Field<'nested', undefined, SelectionSet<[Field<'bar'>]>>]>;
expectType<false>(selectionRequiresArguments(schema, type, selectionSet5));

const selectionSet6 = {} as SelectionSet<[Field<'nested', undefined, SelectionSet<[Field<'baz'>]>>]>;
expectType<true>(selectionRequiresArguments(schema, type, selectionSet6));

//
// `ArgumentDefinitions`
//

declare const argumentDefinitions: {
	<Schema, Type extends Record<string, any>, Sel extends SelectionSet<any>>(
		schema: Schema,
		initialType: Type,
		selectionSet: Sel
	): ArgumentDefinitions<Schema, Type, Sel>;
};

const selectionSet7 = {} as SelectionSet<[Field<'foo'>]>;
expectType<{
	/* empty */
}>(argumentDefinitions(schema, type, selectionSet7));
type test7 = ReturnType<typeof argumentDefinitions<Schema, Query, typeof selectionSet7>>;

const selectionSet8 = {} as SelectionSet<[Field<'bar'>]>;
expectType<{ bar: { optional?: string } }>(argumentDefinitions(schema, type, selectionSet8));
type test8 = ReturnType<typeof argumentDefinitions<Schema, Query, typeof selectionSet8>>;

const selectionSet9 = {} as SelectionSet<[Field<'nested', undefined, SelectionSet<[Field<'baz'>]>>]>;
expectType<{ nested: { baz: { required: string } } }>(argumentDefinitions(schema, type, selectionSet9));
type test9 = ReturnType<typeof argumentDefinitions<Schema, Query, typeof selectionSet9>>;

const selectionSet10 = {} as SelectionSet<
	ReadonlyArray<
		Field<
			'nested',
			undefined,
			SelectionSet<
				ReadonlyArray<Field<'nested2', undefined, SelectionSet<ReadonlyArray<Field<'args'> | Field<'none'>>>>>
			>
		>
	>
>;
expectType<{ nested: { nested2: { args: { required: boolean } } } }>(argumentDefinitions(schema, type, selectionSet10));
type test10 = ReturnType<typeof argumentDefinitions<Schema, Query, typeof selectionSet10>>;

//
// `AbstractTypesInSelection`
//

// interface Schema {
// 	Query: Query
// 	Union: Union
// 	UnionA: UnionA
// 	UnionB: UnionB
// 	Nested: Nested
// }

// interface Query {
// 	union(): Union
// 	nested(): Nested
// }

// interface Union {
// 	__typename(): 'Union'
// 	__abstract: true
// 	__possibleTypes: [UnionA, UnionB]
// }

// interface UnionA {
// 	__typename(): 'UnionA'
// 	a(): number
// }

// interface UnionB {
// 	__typename(): 'UnionB'
// 	b(): boolean
// }

// interface Nested {
// 	__typename(): 'Nested'
// 	id(): string
// 	fooUnion(): FooUnion
// }

// interface FooUnion {
// 	__typename: 'FooUnion'
// 	__abstract: true
// 	__possibleTypes: [UnionA, UnionB]
// }

// type S = SelectionSet<[
// 	Field<'union'>
// ]>

// type test = AbstractTypesInSelection<Schema, Query, S>
