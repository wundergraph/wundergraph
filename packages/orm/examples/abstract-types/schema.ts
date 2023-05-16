import { buildASTSchema, Kind, OperationTypeNode } from 'graphql';

export const SCHEMA = buildASTSchema({
	kind: Kind.DOCUMENT,
	definitions: [
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'Query',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'gqlUnion',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'which',
							},
							type: {
								kind: Kind.NON_NULL_TYPE,
								type: {
									kind: Kind.NAMED_TYPE,
									name: {
										kind: Kind.NAME,
										value: 'Which',
									},
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'GqlUnion',
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.UNION_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'GqlUnion',
			},
			directives: [],
			types: [
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'A',
					},
				},
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'B',
					},
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'A',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'String',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'name',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'String',
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'B',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'String',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'name',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'String',
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.ENUM_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'Which',
			},
			directives: [],
			values: [
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'a',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'b',
					},
					directives: [],
				},
			],
		},
	],
});

export const ENUMS = Object.freeze({
	a: true,
	b: true,
	SCALAR: true,
	OBJECT: true,
	INTERFACE: true,
	UNION: true,
	ENUM: true,
	INPUT_OBJECT: true,
	LIST: true,
	NON_NULL: true,
	QUERY: true,
	MUTATION: true,
	SUBSCRIPTION: true,
	FIELD: true,
	FRAGMENT_DEFINITION: true,
	FRAGMENT_SPREAD: true,
	INLINE_FRAGMENT: true,
	VARIABLE_DEFINITION: true,
	SCHEMA: true,
	FIELD_DEFINITION: true,
	ARGUMENT_DEFINITION: true,
	ENUM_VALUE: true,
	INPUT_FIELD_DEFINITION: true,
} as const);

export interface Schema {
	Query: Query;
	GqlUnion: GqlUnion;
	A: A;
	String: string;
	B: B;
	Which: Which;
	Boolean: boolean;
}

export interface Query {
	__typename(): 'Query';
	gqlUnion(variables: { which: Which }): GqlUnion | null;
}

// export type GqlUnion = A | B;

export type GqlUnion = {
	__typename(): 'A' | 'B';
	__abstract: true;
	__possibleTypes: [A, B];
};

export interface A {
	__typename(): 'A';
	id(): string | null;
	name(): string | null;
	a(): number;
}

export interface B {
	__typename(): 'B';
	id(): string | null;
	name(): string | null;
	b(): boolean;
}

export type Which = 'a' | 'b';
