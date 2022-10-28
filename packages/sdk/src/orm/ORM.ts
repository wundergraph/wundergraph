type _<T> = T;

export type SimplifyType<T> = _<{ [k in keyof T]: T[k] }>;

declare const nameTag: unique symbol;

export interface BaseEntity<TName extends string> {
	[nameTag]: TName;
}

declare const isUnion: unique symbol;

export interface Union<TTypes extends readonly BaseEntity<any>[]> {
	[isUnion]: true;
	types: TTypes;
}

type ValueOf<T> = T[keyof T] & unknown;

export type Model<T> = T extends BaseEntity<infer TName>
	? {
			[K in keyof T as K extends string ? K : never]: ModelField<TName, K & string, T[K]>;
	  }
	: never;

type Primitive = null | boolean | number | string;

interface PrimitiveField<TPath extends string, TValue> {
	readonly path: TPath;
	readonly isField: true;
	readonly isQuery: false;
	createValue(): TValue;
}

type EntityFieldMaker<TPath extends string, TReturn> = <TArgs extends readonly ExtractArgumentTypes<TReturn>[]>(
	...args: TArgs
) => TReturn extends readonly any[]
	? ArrayField<EntityField<TPath, TArgs, TReturn>>
	: EntityField<TPath, TArgs, TReturn>;

interface EntityField<TPath extends string, TArgs, TValue> {
	readonly path: TPath;
	readonly isField: true;
	readonly isQuery: false;
	readonly isArray: false;
	readonly isUnion: false;
	readonly args: TArgs;
	createValue(): TValue;
}

type QueryFieldMaker<TPath extends string, TParams, TReturn> = <
	TArgs extends readonly (ExtractArgumentTypes<TReturn> | TParams)[]
>(
	...args: TArgs
) => TReturn extends readonly any[]
	? ArrayField<QueryField<TPath, TParams, TArgs, TReturn>>
	: QueryField<TPath, TParams, TArgs, TReturn>;

interface QueryField<TPath extends string, TParams, TArgs, TReturn> {
	readonly path: TPath;
	readonly isField: false;
	readonly isQuery: true;
	readonly isArray: false;
	readonly isUnion: false;
	readonly params: TParams;
	readonly args: TArgs;
	readonly return: TReturn;
	createValue(): TReturn;
}

interface ArrayField<TField extends Field> {
	readonly isField: false;
	readonly isQuery: false;
	readonly isArray: true;
	readonly isUnion: false;
	readonly field: TField;
}

type UnionFieldMaker<TPath extends string, TReturn> = <TArgs extends readonly ExtractUnionArgumentTypes<TReturn>[]>(
	...args: TArgs
) => UnionField<TPath, TArgs>;

type ExtractUnionArgumentTypes<TReturn> = TReturn extends [infer THead]
	? THead extends BaseEntity<infer TName>
		? AnyFragment<TName>
		: never
	: TReturn extends [infer THead, ...infer TTail]
	? (THead extends BaseEntity<infer TName> ? AnyFragment<TName> : never) | ExtractUnionArgumentTypes<TTail>
	: unknown;

interface UnionField<TPath extends string, TFragments> {
	readonly path: TPath;
	readonly isField: false;
	readonly isQuery: false;
	readonly isArray: false;
	readonly isUnion: true;
	readonly fragments: TFragments;
}

export type Field =
	| QueryField<any, any, any, any>
	| EntityField<any, any, any>
	| PrimitiveField<any, any>
	| ArrayField<any>
	| UnionField<any, any>;

export type ExtractFieldEntityName<T> = T extends UnionField<`${infer TName}.${string}`, any>
	? TName
	: T extends QueryField<`${infer TName}.${string}`, any, any, any>
	? TName
	: T extends EntityField<`${infer TName}.${string}`, any, any>
	? TName
	: T extends PrimitiveField<`${infer TName}.${string}`, any>
	? TName
	: T extends ArrayField<infer TField>
	? ExtractFieldEntityName<TField>
	: never;

type ExtractArgumentTypes<TValue> = TValue extends BaseEntity<infer TName>
	? ExtractArgumentTypesFromEntity<TName, TValue>
	: TValue extends readonly (infer TElement)[]
	? ExtractArgumentTypes<TElement>
	: { wat: unknown; value: TValue };

type ExtractArgumentTypesFromEntity<TName extends string, TEntity> = ValueOf<{
	[K in keyof TEntity]: FinalModelField<TName, K & string, TEntity[K]>;
}>;

type FinalModelField<TModelName extends string, TKey extends string, TValue> = TValue extends Union<infer TTypes>
	? UnionField<`${TModelName}.${TKey}`, TTypes> & { fish: 1 }
	: TValue extends Primitive
	? PrimitiveField<`${TModelName}.${TKey}`, TValue>
	: TValue extends readonly Primitive[]
	? PrimitiveField<`${TModelName}.${TKey}`, TValue>
	: TValue extends BaseEntity<any>
	? EntityField<`${TModelName}.${TKey}`, any, TValue>
	: TValue extends readonly BaseEntity<any>[]
	? ArrayField<EntityField<`${TModelName}.${TKey}`, any, TValue>>
	: TValue extends (params: infer TParams) => infer TReturn
	? TReturn extends readonly any[]
		? ArrayField<QueryField<`${TModelName}.${TKey}`, TParams, any, TReturn>>
		: QueryField<`${TModelName}.${TKey}`, TParams, any, TReturn>
	: unknown;

type ModelField<TModelName extends string, TKey extends string, TValue> = TValue extends Primitive
	? PrimitiveField<`${TModelName}.${TKey}`, TValue>
	: TValue extends readonly Primitive[]
	? PrimitiveField<`${TModelName}.${TKey}`, TValue>
	: TValue extends BaseEntity<any>
	? EntityFieldMaker<`${TModelName}.${TKey}`, TValue>
	: TValue extends readonly BaseEntity<any>[]
	? EntityFieldMaker<`${TModelName}.${TKey}`, TValue>
	: TValue extends (params: infer TParams) => infer TReturn
	? QueryFieldMaker<`${TModelName}.${TKey}`, TParams, TReturn>
	: TValue extends Union<infer TTypes>
	? UnionFieldMaker<`${TModelName}.${TKey}`, TTypes>
	: unknown;

export type ResolveQuery<T> = T extends ArrayField<infer TField>
	? ResolveQueryPart<TField, true>
	: ResolveQueryPart<T, false>;

type ResolveQueryArgs<TArgs> = TArgs extends [infer THead]
	? ResolveQuery<THead>
	: TArgs extends [infer THead, ...infer TTail]
	? SimplifyType<ResolveQuery<THead> & ResolveQueryArgs<TTail>>
	: unknown;

type ResolveQueryPart<T, TIsArray = void> = T extends UnionField<`${string}.${infer TPath}`, infer TTypes>
	? SimplifyType<{
			[K in TPath]: TIsArray extends true ? ResolveQueryArgs<TTypes>[] : ResolveQueryArgs<TTypes>;
	  }>
	: T extends QueryField<`${string}.${infer TPath}`, any, infer TArgs, any>
	? SimplifyType<{
			[K in TPath]: TIsArray extends true ? ResolveQueryArgs<TArgs>[] : ResolveQueryArgs<TArgs>;
	  }>
	: T extends EntityField<`${string}.${infer TPath}`, infer TArgs, any>
	? SimplifyType<{
			[K in TPath]: TIsArray extends true ? ResolveQueryArgs<TArgs>[] : ResolveQueryArgs<TArgs>;
	  }>
	: T extends PrimitiveField<`${string}.${infer TPath}`, infer TValue>
	? { [K in TPath]: TValue }
	: T extends readonly (infer TElement)[]
	? readonly ResolveQuery<TElement>[]
	: unknown;

type UnwrapArrays<T> = T extends [infer THead]
	? ResolveQuery<THead>
	: T extends [infer THead, ...infer TTail]
	? ResolveQuery<THead> & UnwrapArrays<TTail>
	: unknown;

export declare function query<TQuery extends readonly Field[]>(...fields: TQuery): SimplifyType<UnwrapArrays<TQuery>>;

interface Fragment<TName extends string, TFields extends readonly Field[]> extends BaseEntity<TName> {
	fields: TFields;
}

interface AnyFragment<TName extends string> extends Fragment<TName, any> {}

type ExtractCommonName<TFields> = TFields extends [infer THead]
	? ExtractFieldEntityName<THead>
	: TFields extends [infer THead, ...infer TTail]
	? ExtractFieldEntityName<THead> & ExtractCommonName<TTail>
	: unknown;

export declare function fragment<TFields extends readonly Field[]>(
	...fields: TFields
): [ExtractCommonName<TFields>] extends [never] ? never : Fragment<ExtractCommonName<TFields> & string, TFields>;
