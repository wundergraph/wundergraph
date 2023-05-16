import { buildASTSchema, Kind, OperationTypeNode } from 'graphql';

export const SCHEMA = buildASTSchema({
	kind: Kind.DOCUMENT,
	definitions: [
		{
			kind: Kind.DIRECTIVE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'cacheControl',
			},
			arguments: [
				{
					kind: Kind.INPUT_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'maxAge',
					},
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Int',
						},
					},
					directives: [],
				},
				{
					kind: Kind.INPUT_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'scope',
					},
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'CacheControlScope',
						},
					},
					directives: [],
				},
			],
			repeatable: false,
			locations: [
				{
					kind: Kind.NAME,
					value: 'FIELD_DEFINITION',
				},
				{
					kind: Kind.NAME,
					value: 'OBJECT',
				},
				{
					kind: Kind.NAME,
					value: 'INTERFACE',
				},
			],
		},
		{
			kind: Kind.DIRECTIVE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'Exposes a URL that specifies the behaviour of this scalar.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'specifiedBy',
			},
			arguments: [
				{
					kind: Kind.INPUT_VALUE_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The URL that specifies the behaviour of this scalar.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'url',
					},
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'String',
							},
						},
					},
					directives: [],
				},
			],
			repeatable: false,
			locations: [
				{
					kind: Kind.NAME,
					value: 'SCALAR',
				},
			],
		},
		{
			kind: Kind.ENUM_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'CacheControlScope',
			},
			directives: [],
			values: [
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'PUBLIC',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'PRIVATE',
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'City',
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
							value: 'ID',
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
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'country',
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
						value: 'coord',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Coordinates',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'weather',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Weather',
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
				value: 'Clouds',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'all',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Int',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'visibility',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Int',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'humidity',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Int',
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'ConfigInput',
			},
			directives: [],
			fields: [
				{
					kind: Kind.INPUT_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'units',
					},
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Unit',
						},
					},
					directives: [],
				},
				{
					kind: Kind.INPUT_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'lang',
					},
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Language',
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
				value: 'Coordinates',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'lon',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Float',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'lat',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Float',
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
				value: 'Language',
			},
			directives: [],
			values: [
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'af',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'al',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'ar',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'az',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'bg',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'ca',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'cz',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'da',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'de',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'el',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'en',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'eu',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'fa',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'fi',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'fr',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'gl',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'he',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'hi',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'hr',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'hu',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'it',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'ja',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'kr',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'la',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'lt',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'mk',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'no',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'nl',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'pl',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'pt',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'pt_br',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'ro',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'ru',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'sv',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'se',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'sk',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'sl',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'sp',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'es',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'sr',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'th',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'tr',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'ua',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'uk',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'vi',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'zh_cn',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'zh_tw',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'zu',
					},
					directives: [],
				},
			],
		},
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
						value: 'getCityByName',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'name',
							},
							type: {
								kind: Kind.NON_NULL_TYPE,
								type: {
									kind: Kind.NAMED_TYPE,
									name: {
										kind: Kind.NAME,
										value: 'String',
									},
								},
							},
							directives: [],
						},
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'country',
							},
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
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'config',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ConfigInput',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'City',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'getCityById',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
							type: {
								kind: Kind.LIST_TYPE,
								type: {
									kind: Kind.NON_NULL_TYPE,
									type: {
										kind: Kind.NAMED_TYPE,
										name: {
											kind: Kind.NAME,
											value: 'String',
										},
									},
								},
							},
							directives: [],
						},
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'config',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ConfigInput',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'City',
							},
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
				value: 'Summary',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'title',
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
						value: 'description',
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
						value: 'icon',
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
				value: 'Temperature',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'actual',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Float',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'feelsLike',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Float',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'min',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Float',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'max',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Float',
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
				value: 'Unit',
			},
			directives: [],
			values: [
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'metric',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'imperial',
					},
					directives: [],
				},
				{
					kind: Kind.ENUM_VALUE_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'kelvin',
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.SCALAR_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'The `Upload` scalar type represents a file upload.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Upload',
			},
			directives: [],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'Weather',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'summary',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Summary',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'temperature',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Temperature',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'wind',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Wind',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'clouds',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Clouds',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'timestamp',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Int',
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
				value: 'Wind',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'speed',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Float',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'deg',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Int',
						},
					},
					directives: [],
				},
			],
		},
	],
});

export const ENUMS = Object.freeze({
	PUBLIC: true,
	PRIVATE: true,
	af: true,
	al: true,
	ar: true,
	az: true,
	bg: true,
	ca: true,
	cz: true,
	da: true,
	de: true,
	el: true,
	en: true,
	eu: true,
	fa: true,
	fi: true,
	fr: true,
	gl: true,
	he: true,
	hi: true,
	hr: true,
	hu: true,
	id: true,
	it: true,
	ja: true,
	kr: true,
	la: true,
	lt: true,
	mk: true,
	no: true,
	nl: true,
	pl: true,
	pt: true,
	pt_br: true,
	ro: true,
	ru: true,
	sv: true,
	se: true,
	sk: true,
	sl: true,
	sp: true,
	es: true,
	sr: true,
	th: true,
	tr: true,
	ua: true,
	uk: true,
	vi: true,
	zh_cn: true,
	zh_tw: true,
	zu: true,
	metric: true,
	imperial: true,
	kelvin: true,
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
	CacheControlScope: CacheControlScope;
	City: City;
	ID: string;
	String: string;
	Clouds: Clouds;
	Int: number;
	ConfigInput: ConfigInput;
	Coordinates: Coordinates;
	Float: number;
	Language: Language;
	Query: Query;
	Summary: Summary;
	Temperature: Temperature;
	Unit: Unit;
	Upload: string;
	Weather: Weather;
	Wind: Wind;
	Boolean: boolean;
}

export type CacheControlScope = 'PUBLIC' | 'PRIVATE';

export interface City {
	__typename(): 'City';
	id(): string | null;
	name(): string | null;
	country(): string | null;
	coord(): Coordinates | null;
	weather(): Weather | null;
}

export interface Clouds {
	__typename(): 'Clouds';
	all(): number | null;
	visibility(): number | null;
	humidity(): number | null;
}

export interface ConfigInput {
	units?: Unit;
	lang?: Language;
}

export interface Coordinates {
	__typename(): 'Coordinates';
	lon(): number | null;
	lat(): number | null;
}

export type Language =
	| 'af'
	| 'al'
	| 'ar'
	| 'az'
	| 'bg'
	| 'ca'
	| 'cz'
	| 'da'
	| 'de'
	| 'el'
	| 'en'
	| 'eu'
	| 'fa'
	| 'fi'
	| 'fr'
	| 'gl'
	| 'he'
	| 'hi'
	| 'hr'
	| 'hu'
	| 'id'
	| 'it'
	| 'ja'
	| 'kr'
	| 'la'
	| 'lt'
	| 'mk'
	| 'no'
	| 'nl'
	| 'pl'
	| 'pt'
	| 'pt_br'
	| 'ro'
	| 'ru'
	| 'sv'
	| 'se'
	| 'sk'
	| 'sl'
	| 'sp'
	| 'es'
	| 'sr'
	| 'th'
	| 'tr'
	| 'ua'
	| 'uk'
	| 'vi'
	| 'zh_cn'
	| 'zh_tw'
	| 'zu';

export interface Query {
	__typename(): 'Query';
	getCityByName(variables: { name: string; country?: string; config?: ConfigInput }): City | null;
	getCityById(variables: { id?: string[]; config?: ConfigInput }): ReadonlyArray<City> | null;
}

export interface Summary {
	__typename(): 'Summary';
	title(): string | null;
	description(): string | null;
	icon(): string | null;
}

export interface Temperature {
	__typename(): 'Temperature';
	actual(): number | null;
	feelsLike(): number | null;
	min(): number | null;
	max(): number | null;
}

export type Unit = 'metric' | 'imperial' | 'kelvin';

export interface Weather {
	__typename(): 'Weather';
	summary(): Summary | null;
	temperature(): Temperature | null;
	wind(): Wind | null;
	clouds(): Clouds | null;
	timestamp(): number | null;
}

export interface Wind {
	__typename(): 'Wind';
	speed(): number | null;
	deg(): number | null;
}
