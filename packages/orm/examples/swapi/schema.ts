import { buildASTSchema, Kind, OperationTypeNode } from 'graphql';

export const SCHEMA = buildASTSchema({
	kind: Kind.DOCUMENT,
	definitions: [
		{
			kind: Kind.SCHEMA_DEFINITION,
			directives: [],
			operationTypes: [
				{
					kind: Kind.OPERATION_TYPE_DEFINITION,
					operation: OperationTypeNode.QUERY,
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Query',
						},
					},
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A single film.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Film',
			},
			interfaces: [
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'Node',
					},
				},
			],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The title of this film.',
						block: true,
					},
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
					description: {
						kind: Kind.STRING,
						value: 'The episode number of this film.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'episodeID',
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
					description: {
						kind: Kind.STRING,
						value: 'The opening paragraphs at the beginning of this film.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'openingCrawl',
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
					description: {
						kind: Kind.STRING,
						value: 'The name of the director of this film.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'director',
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
					description: {
						kind: Kind.STRING,
						value: 'The name(s) of the producer(s) of this film.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'producers',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of film release at original creator country.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'releaseDate',
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
						value: 'speciesConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'FilmSpeciesConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'starshipConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'FilmStarshipsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'vehicleConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'FilmVehiclesConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'characterConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'FilmCharactersConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'planetConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'FilmPlanetsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was created.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'created',
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
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was edited.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edited',
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
					description: {
						kind: Kind.STRING,
						value: 'The ID of an object',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'ID',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmCharactersConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'FilmCharactersEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'characters',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Person',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmCharactersEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Person',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmPlanetsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'FilmPlanetsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'planets',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Planet',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmPlanetsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Planet',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'FilmsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'films',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Film',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Film',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmSpeciesConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'FilmSpeciesEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'species',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Species',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmSpeciesEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Species',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmStarshipsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'FilmStarshipsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'starships',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Starship',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmStarshipsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Starship',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmVehiclesConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'FilmVehiclesEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'vehicles',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Vehicle',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'FilmVehiclesEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Vehicle',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.INTERFACE_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An object with an ID',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Node',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The id of the object.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'ID',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'Information about pagination in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PageInfo',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'When paginating forwards, are there more items?',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'hasNextPage',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Boolean',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'When paginating backwards, are there more items?',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'hasPreviousPage',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Boolean',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'When paginating backwards, the cursor to continue.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'startCursor',
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
					description: {
						kind: Kind.STRING,
						value: 'When paginating forwards, the cursor to continue.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'endCursor',
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
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PeopleConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PeopleEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'people',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Person',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PeopleEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Person',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An individual person or character within the Star Wars universe.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Person',
			},
			interfaces: [
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'Node',
					},
				},
			],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The name of this person.',
						block: true,
					},
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
					description: {
						kind: Kind.STRING,
						value:
							'The birth year of the person, using the in-universe standard of BBY or ABY -\nBefore the Battle of Yavin or After the Battle of Yavin. The Battle of Yavin is\na battle that occurs at the end of Star Wars episode IV: A New Hope.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'birthYear',
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
					description: {
						kind: Kind.STRING,
						value:
							'The eye color of this person. Will be "unknown" if not known or "n/a" if the\nperson does not have an eye.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'eyeColor',
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
					description: {
						kind: Kind.STRING,
						value:
							'The gender of this person. Either "Male", "Female" or "unknown",\n"n/a" if the person does not have a gender.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'gender',
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
					description: {
						kind: Kind.STRING,
						value:
							'The hair color of this person. Will be "unknown" if not known or "n/a" if the\nperson does not have hair.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'hairColor',
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
					description: {
						kind: Kind.STRING,
						value: 'The height of the person in centimeters.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'height',
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
					description: {
						kind: Kind.STRING,
						value: 'The mass of the person in kilograms.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'mass',
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
					description: {
						kind: Kind.STRING,
						value: 'The skin color of this person.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'skinColor',
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
					description: {
						kind: Kind.STRING,
						value: 'A planet that this person was born on or inhabits.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'homeworld',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Planet',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'filmConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'PersonFilmsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The species that this person belongs to, or null if unknown.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'species',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Species',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'starshipConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'PersonStarshipsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'vehicleConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'PersonVehiclesConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was created.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'created',
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
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was edited.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edited',
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
					description: {
						kind: Kind.STRING,
						value: 'The ID of an object',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'ID',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PersonFilmsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PersonFilmsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'films',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Film',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PersonFilmsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Film',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PersonStarshipsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PersonStarshipsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'starships',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Starship',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PersonStarshipsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Starship',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PersonVehiclesConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PersonVehiclesEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'vehicles',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Vehicle',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PersonVehiclesEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Vehicle',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A large mass, planet or planetoid in the Star Wars Universe, at the time of\n0 ABY.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Planet',
			},
			interfaces: [
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'Node',
					},
				},
			],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The name of this planet.',
						block: true,
					},
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
					description: {
						kind: Kind.STRING,
						value: 'The diameter of this planet in kilometers.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'diameter',
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
					description: {
						kind: Kind.STRING,
						value: 'The number of standard hours it takes for this planet to complete a single\nrotation on its axis.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'rotationPeriod',
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
					description: {
						kind: Kind.STRING,
						value:
							'The number of standard days it takes for this planet to complete a single orbit\nof its local star.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'orbitalPeriod',
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
					description: {
						kind: Kind.STRING,
						value:
							'A number denoting the gravity of this planet, where "1" is normal or 1 standard\nG. "2" is twice or 2 standard Gs. "0.5" is half or 0.5 standard Gs.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'gravity',
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
					description: {
						kind: Kind.STRING,
						value: 'The average population of sentient beings inhabiting this planet.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'population',
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
					description: {
						kind: Kind.STRING,
						value: 'The climates of this planet.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'climates',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The terrains of this planet.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'terrains',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The percentage of the planet surface that is naturally occurring water or bodies\nof water.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'surfaceWater',
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
						value: 'residentConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'PlanetResidentsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'filmConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'PlanetFilmsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was created.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'created',
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
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was edited.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edited',
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
					description: {
						kind: Kind.STRING,
						value: 'The ID of an object',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'ID',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PlanetFilmsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PlanetFilmsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'films',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Film',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PlanetFilmsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Film',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PlanetResidentsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PlanetResidentsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'residents',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Person',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PlanetResidentsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Person',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PlanetsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PlanetsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'planets',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Planet',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'PlanetsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Planet',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
						value: 'allFilms',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'FilmsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'film',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
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
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'filmID',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ID',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Film',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'allPeople',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'PeopleConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'person',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
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
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'personID',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ID',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Person',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'allPlanets',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'PlanetsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'planet',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
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
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'planetID',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ID',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Planet',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'allSpecies',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'SpeciesConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'species',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
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
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'speciesID',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ID',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Species',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'allStarships',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'StarshipsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'starship',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
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
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'starshipID',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ID',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Starship',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'allVehicles',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'VehiclesConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'vehicle',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
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
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'vehicleID',
							},
							type: {
								kind: Kind.NAMED_TYPE,
								name: {
									kind: Kind.NAME,
									value: 'ID',
								},
							},
							directives: [],
						},
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Vehicle',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Fetches an object given its ID',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							description: {
								kind: Kind.STRING,
								value: 'The ID of an object',
								block: true,
							},
							name: {
								kind: Kind.NAME,
								value: 'id',
							},
							type: {
								kind: Kind.NON_NULL_TYPE,
								type: {
									kind: Kind.NAMED_TYPE,
									name: {
										kind: Kind.NAME,
										value: 'ID',
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
							value: 'Node',
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A type of person or character within the Star Wars Universe.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Species',
			},
			interfaces: [
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'Node',
					},
				},
			],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The name of this species.',
						block: true,
					},
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
					description: {
						kind: Kind.STRING,
						value: 'The classification of this species, such as "mammal" or "reptile".',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'classification',
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
					description: {
						kind: Kind.STRING,
						value: 'The designation of this species, such as "sentient".',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'designation',
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
					description: {
						kind: Kind.STRING,
						value: 'The average height of this species in centimeters.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'averageHeight',
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
					description: {
						kind: Kind.STRING,
						value: 'The average lifespan of this species in years, null if unknown.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'averageLifespan',
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
					description: {
						kind: Kind.STRING,
						value: 'Common eye colors for this species, null if this species does not typically\nhave eyes.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'eyeColors',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Common hair colors for this species, null if this species does not typically\nhave hair.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'hairColors',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Common skin colors for this species, null if this species does not typically\nhave skin.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'skinColors',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The language commonly spoken by this species.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'language',
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
					description: {
						kind: Kind.STRING,
						value: 'A planet that this species originates from.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'homeworld',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Planet',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'personConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'SpeciesPeopleConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'filmConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'SpeciesFilmsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was created.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'created',
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
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was edited.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edited',
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
					description: {
						kind: Kind.STRING,
						value: 'The ID of an object',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'ID',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'SpeciesConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'SpeciesEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'species',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Species',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'SpeciesEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Species',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'SpeciesFilmsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'SpeciesFilmsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'films',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Film',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'SpeciesFilmsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Film',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'SpeciesPeopleConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'SpeciesPeopleEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'people',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Person',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'SpeciesPeopleEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Person',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A single transport craft that has hyperdrive capability.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Starship',
			},
			interfaces: [
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'Node',
					},
				},
			],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The name of this starship. The common name, such as "Death Star".',
						block: true,
					},
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
					description: {
						kind: Kind.STRING,
						value:
							'The model or official name of this starship. Such as "T-65 X-wing" or "DS-1\nOrbital Battle Station".',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'model',
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
					description: {
						kind: Kind.STRING,
						value: 'The class of this starship, such as "Starfighter" or "Deep Space Mobile\nBattlestation"',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'starshipClass',
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
					description: {
						kind: Kind.STRING,
						value: 'The manufacturers of this starship.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'manufacturers',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The cost of this starship new, in galactic credits.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'costInCredits',
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
					description: {
						kind: Kind.STRING,
						value: 'The length of this starship in meters.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'length',
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
					description: {
						kind: Kind.STRING,
						value: 'The number of personnel needed to run or pilot this starship.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'crew',
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
					description: {
						kind: Kind.STRING,
						value: 'The number of non-essential people this starship can transport.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'passengers',
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
					description: {
						kind: Kind.STRING,
						value:
							'The maximum speed of this starship in atmosphere. null if this starship is\nincapable of atmosphering flight.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'maxAtmospheringSpeed',
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
					description: {
						kind: Kind.STRING,
						value: 'The class of this starships hyperdrive.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'hyperdriveRating',
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
					description: {
						kind: Kind.STRING,
						value:
							'The Maximum number of Megalights this starship can travel in a standard hour.\nA "Megalight" is a standard unit of distance and has never been defined before\nwithin the Star Wars universe. This figure is only really useful for measuring\nthe difference in speed of starships. We can assume it is similar to AU, the\ndistance between our Sun (Sol) and Earth.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'MGLT',
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
					description: {
						kind: Kind.STRING,
						value: 'The maximum number of kilograms that this starship can transport.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cargoCapacity',
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
					description: {
						kind: Kind.STRING,
						value:
							'The maximum length of time that this starship can provide consumables for its\nentire crew without having to resupply.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'consumables',
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
						value: 'pilotConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'StarshipPilotsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'filmConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'StarshipFilmsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was created.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'created',
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
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was edited.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edited',
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
					description: {
						kind: Kind.STRING,
						value: 'The ID of an object',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'ID',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'StarshipFilmsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'StarshipFilmsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'films',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Film',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'StarshipFilmsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Film',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'StarshipPilotsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'StarshipPilotsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pilots',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Person',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'StarshipPilotsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Person',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'StarshipsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'StarshipsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'starships',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Starship',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'StarshipsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Starship',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A single transport craft that does not have hyperdrive capability',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'Vehicle',
			},
			interfaces: [
				{
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: 'Node',
					},
				},
			],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The name of this vehicle. The common name, such as "Sand Crawler" or "Speeder\nbike".',
						block: true,
					},
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
					description: {
						kind: Kind.STRING,
						value: 'The model or official name of this vehicle. Such as "All-Terrain Attack\nTransport".',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'model',
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
					description: {
						kind: Kind.STRING,
						value: 'The class of this vehicle, such as "Wheeled" or "Repulsorcraft".',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'vehicleClass',
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
					description: {
						kind: Kind.STRING,
						value: 'The manufacturers of this vehicle.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'manufacturers',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
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
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The cost of this vehicle new, in Galactic Credits.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'costInCredits',
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
					description: {
						kind: Kind.STRING,
						value: 'The length of this vehicle in meters.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'length',
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
					description: {
						kind: Kind.STRING,
						value: 'The number of personnel needed to run or pilot this vehicle.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'crew',
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
					description: {
						kind: Kind.STRING,
						value: 'The number of non-essential people this vehicle can transport.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'passengers',
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
					description: {
						kind: Kind.STRING,
						value: 'The maximum speed of this vehicle in atmosphere.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'maxAtmospheringSpeed',
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
					description: {
						kind: Kind.STRING,
						value: 'The maximum number of kilograms that this vehicle can transport.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cargoCapacity',
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
					description: {
						kind: Kind.STRING,
						value:
							'The maximum length of time that this vehicle can provide consumables for its\nentire crew without having to resupply.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'consumables',
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
						value: 'pilotConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'VehiclePilotsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: 'filmConnection',
					},
					arguments: [
						{
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: 'after',
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
								value: 'first',
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
								value: 'before',
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
								value: 'last',
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
					],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'VehicleFilmsConnection',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was created.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'created',
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
					description: {
						kind: Kind.STRING,
						value: 'The ISO 8601 date format of the time that this resource was edited.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edited',
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
					description: {
						kind: Kind.STRING,
						value: 'The ID of an object',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'id',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'ID',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'VehicleFilmsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'VehicleFilmsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'films',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Film',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'VehicleFilmsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Film',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'VehiclePilotsConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'VehiclePilotsEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pilots',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Person',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'VehiclePilotsEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Person',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'A connection to a list of items.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'VehiclesConnection',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'Information to aid in pagination.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'pageInfo',
					},
					arguments: [],
					type: {
						kind: Kind.NON_NULL_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'PageInfo',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A list of edges.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'edges',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'VehiclesEdge',
							},
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value:
							'A count of the total number of objects in this connection, ignoring pagination.\nThis allows a client to fetch the first five objects by passing "5" as the\nargument to "first", then fetch the total count so it could display "5 of 83",\nfor example.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'totalCount',
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
					description: {
						kind: Kind.STRING,
						value:
							'A list of all of the objects returned in the connection. This is a convenience\nfield provided for quickly exploring the API; rather than querying for\n"{ edges { node } }" when no edge data is needed, this field can be be used\ninstead. Note that when clients like Relay need to fetch the "cursor" field on\nthe edge to enable efficient pagination, this shortcut cannot be used, and the\nfull "{ edges { node } }" version should be used instead.',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'vehicles',
					},
					arguments: [],
					type: {
						kind: Kind.LIST_TYPE,
						type: {
							kind: Kind.NAMED_TYPE,
							name: {
								kind: Kind.NAME,
								value: 'Vehicle',
							},
						},
					},
					directives: [],
				},
			],
		},
		{
			kind: Kind.OBJECT_TYPE_DEFINITION,
			description: {
				kind: Kind.STRING,
				value: 'An edge in a connection.',
				block: true,
			},
			name: {
				kind: Kind.NAME,
				value: 'VehiclesEdge',
			},
			interfaces: [],
			directives: [],
			fields: [
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'The item at the end of the edge',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'node',
					},
					arguments: [],
					type: {
						kind: Kind.NAMED_TYPE,
						name: {
							kind: Kind.NAME,
							value: 'Vehicle',
						},
					},
					directives: [],
				},
				{
					kind: Kind.FIELD_DEFINITION,
					description: {
						kind: Kind.STRING,
						value: 'A cursor for use in pagination',
						block: true,
					},
					name: {
						kind: Kind.NAME,
						value: 'cursor',
					},
					arguments: [],
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
		},
	],
});

export const ENUMS = Object.freeze({
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
	Film: Film;
	String: string;
	Int: number;
	ID: string;
	FilmCharactersConnection: FilmCharactersConnection;
	FilmCharactersEdge: FilmCharactersEdge;
	FilmPlanetsConnection: FilmPlanetsConnection;
	FilmPlanetsEdge: FilmPlanetsEdge;
	FilmsConnection: FilmsConnection;
	FilmsEdge: FilmsEdge;
	FilmSpeciesConnection: FilmSpeciesConnection;
	FilmSpeciesEdge: FilmSpeciesEdge;
	FilmStarshipsConnection: FilmStarshipsConnection;
	FilmStarshipsEdge: FilmStarshipsEdge;
	FilmVehiclesConnection: FilmVehiclesConnection;
	FilmVehiclesEdge: FilmVehiclesEdge;
	Node: Node;
	PageInfo: PageInfo;
	Boolean: boolean;
	PeopleConnection: PeopleConnection;
	PeopleEdge: PeopleEdge;
	Person: Person;
	Float: number;
	PersonFilmsConnection: PersonFilmsConnection;
	PersonFilmsEdge: PersonFilmsEdge;
	PersonStarshipsConnection: PersonStarshipsConnection;
	PersonStarshipsEdge: PersonStarshipsEdge;
	PersonVehiclesConnection: PersonVehiclesConnection;
	PersonVehiclesEdge: PersonVehiclesEdge;
	Planet: Planet;
	PlanetFilmsConnection: PlanetFilmsConnection;
	PlanetFilmsEdge: PlanetFilmsEdge;
	PlanetResidentsConnection: PlanetResidentsConnection;
	PlanetResidentsEdge: PlanetResidentsEdge;
	PlanetsConnection: PlanetsConnection;
	PlanetsEdge: PlanetsEdge;
	Query: Query;
	Species: Species;
	SpeciesConnection: SpeciesConnection;
	SpeciesEdge: SpeciesEdge;
	SpeciesFilmsConnection: SpeciesFilmsConnection;
	SpeciesFilmsEdge: SpeciesFilmsEdge;
	SpeciesPeopleConnection: SpeciesPeopleConnection;
	SpeciesPeopleEdge: SpeciesPeopleEdge;
	Starship: Starship;
	StarshipFilmsConnection: StarshipFilmsConnection;
	StarshipFilmsEdge: StarshipFilmsEdge;
	StarshipPilotsConnection: StarshipPilotsConnection;
	StarshipPilotsEdge: StarshipPilotsEdge;
	StarshipsConnection: StarshipsConnection;
	StarshipsEdge: StarshipsEdge;
	Vehicle: Vehicle;
	VehicleFilmsConnection: VehicleFilmsConnection;
	VehicleFilmsEdge: VehicleFilmsEdge;
	VehiclePilotsConnection: VehiclePilotsConnection;
	VehiclePilotsEdge: VehiclePilotsEdge;
	VehiclesConnection: VehiclesConnection;
	VehiclesEdge: VehiclesEdge;
}

export interface Film {
	__typename(): 'Film';
	title(): string | null;
	episodeID(): number | null;
	openingCrawl(): string | null;
	director(): string | null;
	producers(): ReadonlyArray<string> | null;
	releaseDate(): string | null;
	speciesConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): FilmSpeciesConnection | null;
	starshipConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): FilmStarshipsConnection | null;
	vehicleConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): FilmVehiclesConnection | null;
	characterConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): FilmCharactersConnection | null;
	planetConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): FilmPlanetsConnection | null;
	created(): string | null;
	edited(): string | null;
	id(): string;
}

export interface FilmCharactersConnection {
	__typename(): 'FilmCharactersConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<FilmCharactersEdge> | null;
	totalCount(): number | null;
	characters(): ReadonlyArray<Person> | null;
}

export interface FilmCharactersEdge {
	__typename(): 'FilmCharactersEdge';
	node(): Person | null;
	cursor(): string;
}

export interface FilmPlanetsConnection {
	__typename(): 'FilmPlanetsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<FilmPlanetsEdge> | null;
	totalCount(): number | null;
	planets(): ReadonlyArray<Planet> | null;
}

export interface FilmPlanetsEdge {
	__typename(): 'FilmPlanetsEdge';
	node(): Planet | null;
	cursor(): string;
}

export interface FilmsConnection {
	__typename(): 'FilmsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<FilmsEdge> | null;
	totalCount(): number | null;
	films(): ReadonlyArray<Film> | null;
}

export interface FilmsEdge {
	__typename(): 'FilmsEdge';
	node(): Film | null;
	cursor(): string;
}

export interface FilmSpeciesConnection {
	__typename(): 'FilmSpeciesConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<FilmSpeciesEdge> | null;
	totalCount(): number | null;
	species(): ReadonlyArray<Species> | null;
}

export interface FilmSpeciesEdge {
	__typename(): 'FilmSpeciesEdge';
	node(): Species | null;
	cursor(): string;
}

export interface FilmStarshipsConnection {
	__typename(): 'FilmStarshipsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<FilmStarshipsEdge> | null;
	totalCount(): number | null;
	starships(): ReadonlyArray<Starship> | null;
}

export interface FilmStarshipsEdge {
	__typename(): 'FilmStarshipsEdge';
	node(): Starship | null;
	cursor(): string;
}

export interface FilmVehiclesConnection {
	__typename(): 'FilmVehiclesConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<FilmVehiclesEdge> | null;
	totalCount(): number | null;
	vehicles(): ReadonlyArray<Vehicle> | null;
}

export interface FilmVehiclesEdge {
	__typename(): 'FilmVehiclesEdge';
	node(): Vehicle | null;
	cursor(): string;
}

export interface Node {
	__typename(): 'Film' | 'Person' | 'Planet' | 'Species' | 'Starship' | 'Vehicle';
	__abstract: true;
	__possibleTypes: [Film, Person, Planet, Species, Starship, Vehicle];
	id(): string;
}

export interface PageInfo {
	__typename(): 'PageInfo';
	hasNextPage(): boolean;
	hasPreviousPage(): boolean;
	startCursor(): string | null;
	endCursor(): string | null;
}

export interface PeopleConnection {
	__typename(): 'PeopleConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<PeopleEdge> | null;
	totalCount(): number | null;
	people(): ReadonlyArray<Person> | null;
}

export interface PeopleEdge {
	__typename(): 'PeopleEdge';
	node(): Person | null;
	cursor(): string;
}

export interface Person {
	__typename(): 'Person';
	name(): string | null;
	birthYear(): string | null;
	eyeColor(): string | null;
	gender(): string | null;
	hairColor(): string | null;
	height(): number | null;
	mass(): number | null;
	skinColor(): string | null;
	homeworld(): Planet | null;
	filmConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): PersonFilmsConnection | null;
	species(): Species | null;
	starshipConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): PersonStarshipsConnection | null;
	vehicleConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): PersonVehiclesConnection | null;
	created(): string | null;
	edited(): string | null;
	id(): string;
}

export interface PersonFilmsConnection {
	__typename(): 'PersonFilmsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<PersonFilmsEdge> | null;
	totalCount(): number | null;
	films(): ReadonlyArray<Film> | null;
}

export interface PersonFilmsEdge {
	__typename(): 'PersonFilmsEdge';
	node(): Film | null;
	cursor(): string;
}

export interface PersonStarshipsConnection {
	__typename(): 'PersonStarshipsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<PersonStarshipsEdge> | null;
	totalCount(): number | null;
	starships(): ReadonlyArray<Starship> | null;
}

export interface PersonStarshipsEdge {
	__typename(): 'PersonStarshipsEdge';
	node(): Starship | null;
	cursor(): string;
}

export interface PersonVehiclesConnection {
	__typename(): 'PersonVehiclesConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<PersonVehiclesEdge> | null;
	totalCount(): number | null;
	vehicles(): ReadonlyArray<Vehicle> | null;
}

export interface PersonVehiclesEdge {
	__typename(): 'PersonVehiclesEdge';
	node(): Vehicle | null;
	cursor(): string;
}

export interface Planet {
	__typename(): 'Planet';
	name(): string | null;
	diameter(): number | null;
	rotationPeriod(): number | null;
	orbitalPeriod(): number | null;
	gravity(): string | null;
	population(): number | null;
	climates(): ReadonlyArray<string> | null;
	terrains(): ReadonlyArray<string> | null;
	surfaceWater(): number | null;
	residentConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): PlanetResidentsConnection | null;
	filmConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): PlanetFilmsConnection | null;
	created(): string | null;
	edited(): string | null;
	id(): string;
}

export interface PlanetFilmsConnection {
	__typename(): 'PlanetFilmsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<PlanetFilmsEdge> | null;
	totalCount(): number | null;
	films(): ReadonlyArray<Film> | null;
}

export interface PlanetFilmsEdge {
	__typename(): 'PlanetFilmsEdge';
	node(): Film | null;
	cursor(): string;
}

export interface PlanetResidentsConnection {
	__typename(): 'PlanetResidentsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<PlanetResidentsEdge> | null;
	totalCount(): number | null;
	residents(): ReadonlyArray<Person> | null;
}

export interface PlanetResidentsEdge {
	__typename(): 'PlanetResidentsEdge';
	node(): Person | null;
	cursor(): string;
}

export interface PlanetsConnection {
	__typename(): 'PlanetsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<PlanetsEdge> | null;
	totalCount(): number | null;
	planets(): ReadonlyArray<Planet> | null;
}

export interface PlanetsEdge {
	__typename(): 'PlanetsEdge';
	node(): Planet | null;
	cursor(): string;
}

export interface Query {
	__typename(): 'Query';
	allFilms(variables: { after?: string; first?: number; before?: string; last?: number }): FilmsConnection | null;
	film(variables: { id?: string; filmID?: string }): Film | null;
	allPeople(variables: { after?: string; first?: number; before?: string; last?: number }): PeopleConnection | null;
	person(variables: { id?: string; personID?: string }): Person | null;
	allPlanets(variables: { after?: string; first?: number; before?: string; last?: number }): PlanetsConnection | null;
	planet(variables: { id?: string; planetID?: string }): Planet | null;
	allSpecies(variables: { after?: string; first?: number; before?: string; last?: number }): SpeciesConnection | null;
	species(variables: { id?: string; speciesID?: string }): Species | null;
	allStarships(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): StarshipsConnection | null;
	starship(variables: { id?: string; starshipID?: string }): Starship | null;
	allVehicles(variables: { after?: string; first?: number; before?: string; last?: number }): VehiclesConnection | null;
	vehicle(variables: { id?: string; vehicleID?: string }): Vehicle | null;
	node(variables: { id: string }): Node | null;
}

export interface Species {
	__typename(): 'Species';
	name(): string | null;
	classification(): string | null;
	designation(): string | null;
	averageHeight(): number | null;
	averageLifespan(): number | null;
	eyeColors(): ReadonlyArray<string> | null;
	hairColors(): ReadonlyArray<string> | null;
	skinColors(): ReadonlyArray<string> | null;
	language(): string | null;
	homeworld(): Planet | null;
	personConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): SpeciesPeopleConnection | null;
	filmConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): SpeciesFilmsConnection | null;
	created(): string | null;
	edited(): string | null;
	id(): string;
}

export interface SpeciesConnection {
	__typename(): 'SpeciesConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<SpeciesEdge> | null;
	totalCount(): number | null;
	species(): ReadonlyArray<Species> | null;
}

export interface SpeciesEdge {
	__typename(): 'SpeciesEdge';
	node(): Species | null;
	cursor(): string;
}

export interface SpeciesFilmsConnection {
	__typename(): 'SpeciesFilmsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<SpeciesFilmsEdge> | null;
	totalCount(): number | null;
	films(): ReadonlyArray<Film> | null;
}

export interface SpeciesFilmsEdge {
	__typename(): 'SpeciesFilmsEdge';
	node(): Film | null;
	cursor(): string;
}

export interface SpeciesPeopleConnection {
	__typename(): 'SpeciesPeopleConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<SpeciesPeopleEdge> | null;
	totalCount(): number | null;
	people(): ReadonlyArray<Person> | null;
}

export interface SpeciesPeopleEdge {
	__typename(): 'SpeciesPeopleEdge';
	node(): Person | null;
	cursor(): string;
}

export interface Starship {
	__typename(): 'Starship';
	name(): string | null;
	model(): string | null;
	starshipClass(): string | null;
	manufacturers(): ReadonlyArray<string> | null;
	costInCredits(): number | null;
	length(): number | null;
	crew(): string | null;
	passengers(): string | null;
	maxAtmospheringSpeed(): number | null;
	hyperdriveRating(): number | null;
	MGLT(): number | null;
	cargoCapacity(): number | null;
	consumables(): string | null;
	pilotConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): StarshipPilotsConnection | null;
	filmConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): StarshipFilmsConnection | null;
	created(): string | null;
	edited(): string | null;
	id(): string;
}

export interface StarshipFilmsConnection {
	__typename(): 'StarshipFilmsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<StarshipFilmsEdge> | null;
	totalCount(): number | null;
	films(): ReadonlyArray<Film> | null;
}

export interface StarshipFilmsEdge {
	__typename(): 'StarshipFilmsEdge';
	node(): Film | null;
	cursor(): string;
}

export interface StarshipPilotsConnection {
	__typename(): 'StarshipPilotsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<StarshipPilotsEdge> | null;
	totalCount(): number | null;
	pilots(): ReadonlyArray<Person> | null;
}

export interface StarshipPilotsEdge {
	__typename(): 'StarshipPilotsEdge';
	node(): Person | null;
	cursor(): string;
}

export interface StarshipsConnection {
	__typename(): 'StarshipsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<StarshipsEdge> | null;
	totalCount(): number | null;
	starships(): ReadonlyArray<Starship> | null;
}

export interface StarshipsEdge {
	__typename(): 'StarshipsEdge';
	node(): Starship | null;
	cursor(): string;
}

export interface Vehicle {
	__typename(): 'Vehicle';
	name(): string | null;
	model(): string | null;
	vehicleClass(): string | null;
	manufacturers(): ReadonlyArray<string> | null;
	costInCredits(): number | null;
	length(): number | null;
	crew(): string | null;
	passengers(): string | null;
	maxAtmospheringSpeed(): number | null;
	cargoCapacity(): number | null;
	consumables(): string | null;
	pilotConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): VehiclePilotsConnection | null;
	filmConnection(variables: {
		after?: string;
		first?: number;
		before?: string;
		last?: number;
	}): VehicleFilmsConnection | null;
	created(): string | null;
	edited(): string | null;
	id(): string;
}

export interface VehicleFilmsConnection {
	__typename(): 'VehicleFilmsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<VehicleFilmsEdge> | null;
	totalCount(): number | null;
	films(): ReadonlyArray<Film> | null;
}

export interface VehicleFilmsEdge {
	__typename(): 'VehicleFilmsEdge';
	node(): Film | null;
	cursor(): string;
}

export interface VehiclePilotsConnection {
	__typename(): 'VehiclePilotsConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<VehiclePilotsEdge> | null;
	totalCount(): number | null;
	pilots(): ReadonlyArray<Person> | null;
}

export interface VehiclePilotsEdge {
	__typename(): 'VehiclePilotsEdge';
	node(): Person | null;
	cursor(): string;
}

export interface VehiclesConnection {
	__typename(): 'VehiclesConnection';
	pageInfo(): PageInfo;
	edges(): ReadonlyArray<VehiclesEdge> | null;
	totalCount(): number | null;
	vehicles(): ReadonlyArray<Vehicle> | null;
}

export interface VehiclesEdge {
	__typename(): 'VehiclesEdge';
	node(): Vehicle | null;
	cursor(): string;
}
