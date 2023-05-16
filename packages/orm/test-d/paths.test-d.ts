import { expectType } from 'tsd';
import type { Field, SelectionSet } from '@timkendall/tql';
import type { Tuples, Strings, Call } from 'hotscript';

import type { ToSelectionSet } from '../src/paths';

// @todo our runtime `selectionRequiresArguments` implementation should have this signature
declare const toSelectionSet: {
	<Paths extends string[]>(...paths: Paths): ToSelectionSet<Call<Tuples.Map<Strings.Split<'.'>>, Paths>>;
};

type selectionSet1 = SelectionSet<ReadonlyArray<Field<'foo'>>>;
expectType<selectionSet1>(toSelectionSet('foo'));

type selectionSet2 = SelectionSet<ReadonlyArray<Field<'foo'> | Field<'bar'>>>;
expectType<selectionSet2>(toSelectionSet('foo', 'bar'));

type selectionSet3 = SelectionSet<
	ReadonlyArray<Field<'foo'> | Field<'bar'> | Field<'baz', undefined, SelectionSet<ReadonlyArray<Field<'foo'>>>>>
>;
expectType<selectionSet3>(toSelectionSet('foo', 'bar', 'baz.foo'));
