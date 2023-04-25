import { mergeApis } from './merge';
import { Api, GraphQLApi, GraphQLApiCustom } from './index';
import { ArgumentRenderConfiguration, ArgumentSource, DataSourceKind, HTTPMethod } from '@wundergraph/protobuf';
import { mapInputVariable } from '../configure/variables';

test('Should be merged', () => {
	const userApi: GraphQLApi = new GraphQLApi(
		'type Query @extends {   me: User } type User @key(fields: "id") {   id: ID!   name: String   username: String }',
		'',
		[
			{
				Kind: DataSourceKind.GRAPHQL,
				RootNodes: [
					{
						typeName: 'Query',
						fieldNames: ['me'],
					},
				],
				ChildNodes: [
					{
						typeName: 'User',
						fieldNames: ['id', 'name', 'username'],
					},
				],
				Custom: {
					Federation: {
						Enabled: true,
						ServiceSDL:
							'type Query @extends {   me: User } type User @key(fields: "id") {   id: ID!   name: String   username: String }',
					},
					Subscription: {
						Enabled: false,
						URL: mapInputVariable(''),
						UseSSE: false,
					},
					Fetch: {
						url: mapInputVariable('https://user.service'),
						baseUrl: mapInputVariable(''),
						path: mapInputVariable(''),
						method: HTTPMethod.POST,
						body: mapInputVariable(''),
						header: {},
						query: [],
						mTLS: undefined,
						upstreamAuthentication: undefined,
						urlEncodeBody: false,
					},
					UpstreamSchema: '',
					HooksConfiguration: {
						onWSTransportConnectionInit: false,
					},
					CustomScalarTypeFields: [],
				},
				Directives: [],
				RequestTimeoutSeconds: 0,
			},
		],
		[],
		[],
		[]
	);

	const productApi: GraphQLApi = new GraphQLApi(
		'type Query @extends {   topProducts(first: Int = 5): [Product] }  type Product @key(fields: "upc") {   upc: String!   name: String   price: Int   weight: Int }',
		'',
		[
			{
				Kind: DataSourceKind.GRAPHQL,
				RootNodes: [
					{
						typeName: 'Query',
						fieldNames: ['topProducts'],
					},
				],
				ChildNodes: [
					{
						typeName: 'Product',
						fieldNames: ['upc', 'name', 'price', 'weight'],
					},
				],
				Custom: {
					Federation: {
						Enabled: true,
						ServiceSDL:
							'type Query @extends {   topProducts(first: Int = 5): [Product] }  type Product @key(fields: "upc") {   upc: String!   name: String   price: Int   weight: Int }',
					},
					Subscription: {
						Enabled: false,
						URL: mapInputVariable(''),
						UseSSE: false,
					},
					Fetch: {
						url: mapInputVariable('https://product.service'),
						baseUrl: mapInputVariable(''),
						path: mapInputVariable(''),
						method: HTTPMethod.POST,
						query: [],
						header: {},
						body: mapInputVariable(''),
						mTLS: undefined,
						upstreamAuthentication: undefined,
						urlEncodeBody: false,
					},
					UpstreamSchema: '',
					HooksConfiguration: {
						onWSTransportConnectionInit: false,
					},
					CustomScalarTypeFields: [],
				},
				Directives: [],
				RequestTimeoutSeconds: 0,
			},
		],
		[
			{
				typeName: 'Query',
				fieldName: 'topProducts',
				argumentsConfiguration: [
					{
						name: 'first',
						sourceType: ArgumentSource.FIELD_ARGUMENT,
						sourcePath: [],
						renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_GRAPHQL_VALUE,
						renameTypeTo: '',
					},
				],
				requiresFields: [],
				path: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
		],
		[],
		[]
	);

	const reviewsApi: GraphQLApi = new GraphQLApi(
		'type Review @key(fields: "id") {   id: ID!   body: String   author: User @provides(fields: "username")   product: Product }  type User @extends @key(fields: "id") {   id: ID! @external   username: String @external   reviews: [Review] }  type Product @extends @key(fields: "upc") {   upc: String! @external   reviews: [Review] } ',
		'',
		[
			{
				Kind: DataSourceKind.GRAPHQL,
				RootNodes: [
					{
						typeName: 'User',
						fieldNames: ['reviews'],
					},
					{
						typeName: 'Product',
						fieldNames: ['reviews'],
					},
				],
				ChildNodes: [
					{
						typeName: 'Review',
						fieldNames: ['id', 'body', 'author', 'product'],
					},
					{
						typeName: 'User',
						fieldNames: ['id'],
					},
					{
						typeName: 'Product',
						fieldNames: ['upc'],
					},
				],
				Custom: {
					Federation: {
						Enabled: true,
						ServiceSDL:
							'type Review @key(fields: "id") {   id: ID!   body: String   author: User @provides(fields: "username")   product: Product }  type User @extends @key(fields: "id") {   id: ID! @external   username: String @external   reviews: [Review] }  type Product @extends @key(fields: "upc") {   upc: String! @external   reviews: [Review] }',
					},
					Subscription: {
						Enabled: false,
						URL: mapInputVariable(''),
						UseSSE: false,
					},
					Fetch: {
						url: mapInputVariable('https://reviews.service'),
						baseUrl: mapInputVariable(''),
						path: mapInputVariable(''),
						method: HTTPMethod.POST,
						body: mapInputVariable(''),
						header: {},
						query: [],
						upstreamAuthentication: undefined,
						mTLS: undefined,
						urlEncodeBody: false,
					},
					UpstreamSchema: '',
					HooksConfiguration: {
						onWSTransportConnectionInit: false,
					},
					CustomScalarTypeFields: [],
				},
				Directives: [],
				RequestTimeoutSeconds: 0,
			},
		],
		[
			{
				typeName: 'User',
				fieldName: 'reviews',
				requiresFields: ['id'],
				path: [],
				argumentsConfiguration: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
			{
				typeName: 'Product',
				fieldName: 'reviews',
				requiresFields: ['upc'],
				argumentsConfiguration: [],
				path: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
		],
		[],
		[]
	);

	const inventoryApi: GraphQLApi = new GraphQLApi(
		'type Product @extends @key(fields: "upc") {     upc: String! @external     weight: Int @external     price: Int @external     inStock: Boolean     shippingEstimate: Int @requires(fields: "price weight") } ',
		'',
		[
			{
				Kind: DataSourceKind.GRAPHQL,
				RootNodes: [
					{
						typeName: 'Product',
						fieldNames: ['inStock', 'shippingEstimate'],
					},
				],
				ChildNodes: [
					{
						typeName: 'Product',
						fieldNames: ['upc'],
					},
				],
				Custom: {
					Federation: {
						Enabled: true,
						ServiceSDL:
							'type Product @extends @key(fields: "upc") {     upc: String! @external     weight: Int @external     price: Int @external     inStock: Boolean     shippingEstimate: Int @requires(fields: "price weight") }',
					},
					Subscription: {
						Enabled: false,
						URL: mapInputVariable(''),
						UseSSE: false,
					},
					Fetch: {
						url: mapInputVariable('https://inventory.service'),
						baseUrl: mapInputVariable(''),
						path: mapInputVariable(''),
						method: HTTPMethod.POST,
						query: [],
						header: {},
						body: mapInputVariable(''),
						upstreamAuthentication: undefined,
						mTLS: undefined,
						urlEncodeBody: false,
					},
					UpstreamSchema: '',
					HooksConfiguration: {
						onWSTransportConnectionInit: false,
					},
					CustomScalarTypeFields: [],
				},
				Directives: [],
				RequestTimeoutSeconds: 0,
			},
		],
		[
			{
				typeName: 'Product',
				fieldName: 'inStock',
				requiresFields: ['upc'],
				path: [],
				argumentsConfiguration: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
			{
				typeName: 'Product',
				fieldName: 'shippingEstimate',
				requiresFields: ['upc'],
				argumentsConfiguration: [],
				path: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
		],
		[],
		[]
	);

	const expectedSchema =
		'directive @fromClaim(name: WG_WELL_KNOWN_CLAIM) on VARIABLE_DEFINITION\n\ndirective @hooksVariable on VARIABLE_DEFINITION\n\ndirective @jsonSchema(\n  """\n  The value of both of these keywords MUST be a string.\n  \n  Both of these keywords can be used to decorate a user interface with\n  information about the data produced by this user interface.  A title\n  will preferably be short, whereas a description will provide\n  explanation about the purpose of the instance described by this\n  schema.\n  """\n  title: String\n  """\n  The value of both of these keywords MUST be a string.\n  \n  Both of these keywords can be used to decorate a user interface with\n  information about the data produced by this user interface.  A title\n  will preferably be short, whereas a description will provide\n  explanation about the purpose of the instance described by this\n  schema.\n  """\n  description: String\n  """\n  The value of "multipleOf" MUST be a number, strictly greater than 0.\n  \n  A numeric instance is valid only if division by this keyword\'s value\n  results in an integer.\n  """\n  multipleOf: Int\n  """\n  The value of "maximum" MUST be a number, representing an inclusive\n  upper limit for a numeric instance.\n  \n  If the instance is a number, then this keyword validates only if the\n  instance is less than or exactly equal to "maximum".\n  """\n  maximum: Int\n  """\n  The value of "exclusiveMaximum" MUST be number, representing an\n  exclusive upper limit for a numeric instance.\n  \n  If the instance is a number, then the instance is valid only if it\n  has a value strictly less than (not equal to) "exclusiveMaximum".\n  """\n  exclusiveMaximum: Int\n  """\n  The value of "minimum" MUST be a number, representing an inclusive\n  lower limit for a numeric instance.\n  \n  If the instance is a number, then this keyword validates only if the\n  instance is greater than or exactly equal to "minimum".\n  """\n  minimum: Int\n  """\n  The value of "exclusiveMinimum" MUST be number, representing an\n  exclusive lower limit for a numeric instance.\n  \n  If the instance is a number, then the instance is valid only if it\n  has a value strictly greater than (not equal to) "exclusiveMinimum".\n  """\n  exclusiveMinimum: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  A string instance is valid against this keyword if its length is less\n  than, or equal to, the value of this keyword.\n  \n  The length of a string instance is defined as the number of its\n  characters as defined by RFC 7159 [RFC7159].\n  """\n  maxLength: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  A string instance is valid against this keyword if its length is\n  greater than, or equal to, the value of this keyword.\n  \n  The length of a string instance is defined as the number of its\n  characters as defined by RFC 7159 [RFC7159].\n  \n  Omitting this keyword has the same behavior as a value of 0.\n  """\n  minLength: Int\n  """\n  The value of this keyword MUST be a string.  This string SHOULD be a\n  valid regular expression, according to the ECMA 262 regular\n  expression dialect.\n  \n  A string instance is considered valid if the regular expression\n  matches the instance successfully.  Recall: regular expressions are\n  not implicitly anchored.\n  """\n  pattern: String\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  An array instance is valid against "maxItems" if its size is less\n  than, or equal to, the value of this keyword.\n  """\n  maxItems: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  An array instance is valid against "minItems" if its size is greater\n  than, or equal to, the value of this keyword.\n  \n  Omitting this keyword has the same behavior as a value of 0.\n  """\n  minItems: Int\n  """\n  The value of this keyword MUST be a boolean.\n  \n  If this keyword has boolean value false, the instance validates\n  successfully.  If it has boolean value true, the instance validates\n  successfully if all of its elements are unique.\n  \n  Omitting this keyword has the same behavior as a value of false.\n  """\n  uniqueItems: Boolean\n  commonPattern: COMMON_REGEX_PATTERN\n) on VARIABLE_DEFINITION\n\ntype Query {\n  me: User\n  topProducts(first: Int = 5): [Product]\n}\n\ntype User {\n  id: ID!\n  name: String\n  username: String\n  reviews: [Review]\n}\n\ntype Product {\n  upc: String!\n  name: String\n  price: Int\n  weight: Int\n  reviews: [Review]\n  inStock: Boolean\n  shippingEstimate: Int\n}\n\ntype Review {\n  id: ID!\n  body: String\n  author: User\n  product: Product\n}\n\nenum WG_WELL_KNOWN_CLAIM {\n  EMAIL\n  EMAIL_VERIFIED\n  NAME\n  NICKNAME\n  LOCATION\n  PROVIDER\n}\n\nenum COMMON_REGEX_PATTERN {\n  EMAIL\n  DOMAIN\n}\n';

	const expected: Api<GraphQLApiCustom> = new Api<GraphQLApiCustom>(
		expectedSchema,
		'',
		[...userApi.DataSources, ...productApi.DataSources, ...reviewsApi.DataSources, ...inventoryApi.DataSources],
		[
			{
				typeName: 'Query',
				fieldName: 'topProducts',
				argumentsConfiguration: [
					{
						name: 'first',
						sourceType: ArgumentSource.FIELD_ARGUMENT,
						sourcePath: [],
						renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_GRAPHQL_VALUE,
						renameTypeTo: '',
					},
				],
				requiresFields: [],
				path: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
			{
				typeName: 'User',
				fieldName: 'reviews',
				requiresFields: ['id'],
				path: [],
				argumentsConfiguration: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
			{
				typeName: 'Product',
				fieldName: 'reviews',
				requiresFields: ['upc'],
				argumentsConfiguration: [],
				path: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
			{
				typeName: 'Product',
				fieldName: 'inStock',
				requiresFields: ['upc'],
				path: [],
				argumentsConfiguration: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
			{
				typeName: 'Product',
				fieldName: 'shippingEstimate',
				requiresFields: ['upc'],
				argumentsConfiguration: [],
				path: [],
				disableDefaultFieldMapping: false,
				unescapeResponseJson: false,
			},
		],
		[],
		[]
	);

	const actual = mergeApis([], [], userApi, productApi, reviewsApi, inventoryApi);
	expect(actual.Schema).toMatchSnapshot('merged_schema');
	expect(pretty(actual)).toMatchSnapshot('merged_apis');
});

const pretty = (input: any) => {
	return JSON.stringify(input, null, '  ');
};
