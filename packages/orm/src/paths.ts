import { Field, SelectionSet, field, selectionSet } from '@timkendall/tql';
import type { Fn, Unions, Tuples, Objects, Strings, Booleans, Call, Pipe } from 'hotscript';
import * as R from 'remeda';

type Primitive = string | number | boolean | bigint | null | undefined | symbol;

type Keys<src> = src extends unknown[]
	? {
			[key in keyof src]: key;
	  }[number] extends infer res
		? res extends string
			? Call<Strings.ToNumber, res> & keyof src
			: res & keyof src
		: never
	: keyof src;

type JoinPath<A extends string, B extends string, Sep extends string = ''> = [A] extends [never]
	? B
	: [B] extends [never]
	? A
	: `${A}${Sep}${B}`;

type Increment<A extends number[]> = [...A, 0];

// @note this is `hotscript`'s `AllPaths` type modified to limit recursion (and handle our schema format; i.e { foo(): string })
type AllPathsImp<
	T,
	ParentPath extends string = never,
	Depth extends number = 0,
	CurrentDepth extends number[] = []
> = CurrentDepth['length'] extends Depth
	? ParentPath
	: T extends Primitive
	? ParentPath
	: unknown extends T
	? JoinPath<ParentPath, string, '.'>
	: T extends any[] // @todo remove this
	? Keys<T> extends infer key extends string | number
		?
				| JoinPath<ParentPath, `[${key}]`>
				| AllPathsImp<T[number], JoinPath<ParentPath, `[${key}]`>, Depth, Increment<CurrentDepth>>
		: never
	: keyof T extends infer key extends keyof T & string
	? key extends any
		?
				| JoinPath<ParentPath, key, '.'>
				| AllPathsImp<
						T[key] extends (...args: any[]) => infer TT ? (TT extends ReadonlyArray<infer TTT> ? TTT : TT) : T[key],
						JoinPath<ParentPath, key, '.'>,
						Depth,
						Increment<CurrentDepth>
				  >
		: never
	: ParentPath;

interface AllPaths extends Fn {
	return: // Don't allow selection on union types (quick workaround for internal `__abstract` and `__possibleTypes` schema fields)
	this['arg0'] extends { __abstract: true }
		? never
		: // Limit recursion to an arbitrary number of 3
		  AllPathsImp<this['arg0'], never, 3>;
}

export type Paths<T> = Call<AllPaths, T>;

// How do we partition paths?
// @todo Use TS@5 `const T extends readonly string[]`
// @todo See if we can remove some union-to-tuple (and back) conversions (see if we can operate on a single type; unions or tuples)
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#const-type-parameters

/**
 * Prelude (arrange data): Split strings into path segments (e.g [`foo.bar.baz`] -> [['foo', 'bar', 'baz']])
 *
 * 1. Pluck head and convert to objects (e.g `[{ field: 'foo', selection: ['bar','baz'] }]`)
 * 4. Group segments by field (e.g `{ foo: [['bar','baz']] }`)
 * 5. Back to tuples (e.g `[ ['foo', ['bar','baz']] ]`)
 * 5. Recursively map to `Fields` (e.g [Field<'foo', undefined, ToSelectionSet<[['bar','baz']]>>])
 */

interface ToObject extends Fn {
	return: this['arg0'] extends [infer Head, ...infer Rest] ? { field: Head; selection: Rest } : never;
}

interface GetFieldKey extends Fn {
	return: this['arg0'] extends { field: infer Field } ? Field : never;
}

interface ToSegments extends Fn {
	return: this['arg0'] extends Array<{ field: string; selection: infer Sel extends string[] }>
		? Sel[0] extends undefined
			? undefined
			: Pipe<Sel, [Unions.ToTuple]>
		: never;
}

interface ToField extends Fn {
	return: this['arg0'] extends [infer FieldName extends string, undefined]
		? Field<FieldName>
		: this['arg0'] extends [infer FieldName extends string, infer Sel extends string[][]]
		? Field<FieldName, undefined, ToSelectionSet<Sel>>
		: never;
}

export type ToSelectionSet<Segments extends string[][]> = SelectionSet<
	ReadonlyArray<
		Pipe<
			Segments,
			[
				// @note address `Field<"dragon", undefined, ToSelectionSet<[[]], ["diameter", "feet"], [...]]>`
				// i.e where is that empty head segment coming from?
				//
				// This works for now..
				Tuples.Filter<Booleans.NotEqual<[]>>,

				Tuples.Map<ToObject>,
				Objects.GroupBy<GetFieldKey>,
				Objects.MapValues<ToSegments>,
				Objects.Entries,
				Unions.ToTuple,
				Tuples.Map<ToField>,
				Tuples.ToUnion
			]
		>
	>
>;

export const toSelectionSet = <T extends string[][]>(segments: T): ToSelectionSet<T> => {
	return selectionSet(
		R.pipe(
			segments,
			R.map(([head, ...rest]) => ({ field: head, selection: rest })),
			R.groupBy(({ field }) => field),
			R.mapValues((values) => values.map(({ selection }) => (selection.length === 0 ? undefined : selection))),
			R.toPairs,
			R.map(([fieldName, selections]) =>
				selections.length === 0
					? field(fieldName)
					: field(fieldName, undefined, toSelectionSet(selections.filter(Boolean) as string[][]))
			)
		)
	) as unknown as ToSelectionSet<T>;
};
