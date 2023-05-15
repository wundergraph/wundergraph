import type { Booleans, Objects, Tuples, Unions, Pipe } from 'hotscript';
import { type GraphQLField, isNonNullType } from 'graphql';

// @note extract the base ("named type" in GraphQL AST terms) type from our TypeScript field schema
// @todo unwrap nullable and nested list types
export type NamedType<Type> = Type extends ReadonlyArray<infer InnerType> ? InnerType : Type;

export type ArgumentsFromField<FieldDef> = FieldDef extends () => any
	? undefined
	: FieldDef extends (variables: infer T) => any
	? T
	: undefined;

export type FieldHasArguments<FieldDef> = ArgumentsFromField<FieldDef> extends object ? true : false;

export const fieldHasArguments = (field: GraphQLField<any, any>): boolean => field.args.length > 0;

export type FieldRequiresArguments<FieldDef> = ArgumentsFromField<FieldDef> extends infer T
	? T extends object
		? Pipe<T, [Objects.PickBy<Booleans.DoesNotExtend<undefined>>, Booleans.NotEqual<{}>]>
		: false
	: false;

export const fieldRequiresArguments = (field: GraphQLField<any, any>): boolean =>
	field.args.some(({ type }) => isNonNullType(type));
