import { expectType } from 'tsd';

import { type ArgumentsFromField, type FieldHasArguments, type FieldRequiresArguments } from '../src/definition';

type Foo = () => boolean;
type Bar = (variables: { optional?: string }) => boolean;
type Baz = (variables: { required: string }) => boolean;

//
// `ArgumentsFromField`
//

declare const argumentsFromField: {
	<FieldDef>(fieldDef: FieldDef): ArgumentsFromField<FieldDef>;
};

const fieldDef = {} as Foo;
expectType<undefined>(argumentsFromField(fieldDef));

const fieldDef2 = {} as Bar;
expectType<{ optional?: string }>(argumentsFromField(fieldDef2));

const fieldDef3 = {} as Baz;
expectType<{ required: string }>(argumentsFromField(fieldDef3));

//
// `FieldHasArguments`
//

declare const fieldHasArguments: {
	<FieldDef>(fieldDef: FieldDef): FieldHasArguments<FieldDef>;
};

const fieldDef4 = {} as Foo;
expectType<false>(fieldHasArguments(fieldDef4));

const fieldDef5 = {} as Bar;
expectType<true>(fieldHasArguments(fieldDef5));

const fieldDef6 = {} as Baz;
expectType<true>(fieldHasArguments(fieldDef6));

//
// `FieldRequiresArguments`
//

declare const fieldRequiresArguments: {
	<FieldDef>(fieldDef: FieldDef): FieldRequiresArguments<FieldDef>;
};

const fieldDef7 = {} as Foo;
expectType<false>(fieldRequiresArguments(fieldDef7));

const fieldDef8 = {} as Bar;
expectType<false>(fieldRequiresArguments(fieldDef8));

type tt = FieldRequiresArguments<Bar>;

const fieldDef9 = {} as Baz;
expectType<true>(fieldRequiresArguments(fieldDef9));

type tt3 = FieldRequiresArguments<Baz>;
