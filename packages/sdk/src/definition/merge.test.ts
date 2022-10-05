import { mergeApis } from './merge';
import { Api, GraphQLApi, GraphQLApiCustom } from './index';
import { ArgumentRenderConfiguration, ArgumentSource, DataSourceKind, HTTPMethod } from '@wundergraph/protobuf';
import { resolveIntegration } from '../configure';
import { mapInputVariable } from '../configure/variables';

test('Should be merged', () => {
	const userApi: GraphQLApi = new GraphQLApi(
		'type Query @extends {   me: User } type User @key(fields: "id") {   id: ID!   name: String   username: String }',
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
				},
				Directives: [],
				TimeoutMilliseconds: 0,
			},
		],
		[],
		[],
		[]
	);

	const productApi: GraphQLApi = new GraphQLApi(
		'type Query @extends {   topProducts(first: Int = 5): [Product] }  type Product @key(fields: "upc") {   upc: String!   name: String   price: Int   weight: Int }',
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
				},
				Directives: [],
				TimeoutMilliseconds: 0,
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
				},
				Directives: [],
				TimeoutMilliseconds: 0,
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
				},
				Directives: [],
				TimeoutMilliseconds: 0,
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
		'directive @fromClaim(name: Claim) on VARIABLE_DEFINITION\n\ndirective @hooksVariable on VARIABLE_DEFINITION\n\ndirective @jsonSchema(\n  """\n  The value of both of these keywords MUST be a string.\n  \n  Both of these keywords can be used to decorate a user interface with\n  information about the data produced by this user interface.  A title\n  will preferably be short, whereas a description will provide\n  explanation about the purpose of the instance described by this\n  schema.\n  """\n  title: String\n  """\n  The value of both of these keywords MUST be a string.\n  \n  Both of these keywords can be used to decorate a user interface with\n  information about the data produced by this user interface.  A title\n  will preferably be short, whereas a description will provide\n  explanation about the purpose of the instance described by this\n  schema.\n  """\n  description: String\n  """\n  The value of "multipleOf" MUST be a number, strictly greater than 0.\n  \n  A numeric instance is valid only if division by this keyword\'s value\n  results in an integer.\n  """\n  multipleOf: Int\n  """\n  The value of "maximum" MUST be a number, representing an inclusive\n  upper limit for a numeric instance.\n  \n  If the instance is a number, then this keyword validates only if the\n  instance is less than or exactly equal to "maximum".\n  """\n  maximum: Int\n  """\n  The value of "exclusiveMaximum" MUST be number, representing an\n  exclusive upper limit for a numeric instance.\n  \n  If the instance is a number, then the instance is valid only if it\n  has a value strictly less than (not equal to) "exclusiveMaximum".\n  """\n  exclusiveMaximum: Int\n  """\n  The value of "minimum" MUST be a number, representing an inclusive\n  lower limit for a numeric instance.\n  \n  If the instance is a number, then this keyword validates only if the\n  instance is greater than or exactly equal to "minimum".\n  """\n  minimum: Int\n  """\n  The value of "exclusiveMinimum" MUST be number, representing an\n  exclusive lower limit for a numeric instance.\n  \n  If the instance is a number, then the instance is valid only if it\n  has a value strictly greater than (not equal to) "exclusiveMinimum".\n  """\n  exclusiveMinimum: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  A string instance is valid against this keyword if its length is less\n  than, or equal to, the value of this keyword.\n  \n  The length of a string instance is defined as the number of its\n  characters as defined by RFC 7159 [RFC7159].\n  """\n  maxLength: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  A string instance is valid against this keyword if its length is\n  greater than, or equal to, the value of this keyword.\n  \n  The length of a string instance is defined as the number of its\n  characters as defined by RFC 7159 [RFC7159].\n  \n  Omitting this keyword has the same behavior as a value of 0.\n  """\n  minLength: Int\n  """\n  The value of this keyword MUST be a string.  This string SHOULD be a\n  valid regular expression, according to the ECMA 262 regular\n  expression dialect.\n  \n  A string instance is considered valid if the regular expression\n  matches the instance successfully.  Recall: regular expressions are\n  not implicitly anchored.\n  """\n  pattern: String\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  An array instance is valid against "maxItems" if its size is less\n  than, or equal to, the value of this keyword.\n  """\n  maxItems: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  An array instance is valid against "minItems" if its size is greater\n  than, or equal to, the value of this keyword.\n  \n  Omitting this keyword has the same behavior as a value of 0.\n  """\n  minItems: Int\n  """\n  The value of this keyword MUST be a boolean.\n  \n  If this keyword has boolean value false, the instance validates\n  successfully.  If it has boolean value true, the instance validates\n  successfully if all of its elements are unique.\n  \n  Omitting this keyword has the same behavior as a value of false.\n  """\n  uniqueItems: Boolean\n  commonPattern: COMMON_REGEX_PATTERN\n) on VARIABLE_DEFINITION\n\ntype Query {\n  me: User\n  topProducts(first: Int = 5): [Product]\n}\n\ntype User {\n  id: ID!\n  name: String\n  username: String\n  reviews: [Review]\n}\n\ntype Product {\n  upc: String!\n  name: String\n  price: Int\n  weight: Int\n  reviews: [Review]\n  inStock: Boolean\n  shippingEstimate: Int\n}\n\ntype Review {\n  id: ID!\n  body: String\n  author: User\n  product: Product\n}\n\nenum Claim {\n  EMAIL\n  EMAIL_VERIFIED\n  NAME\n  NICKNAME\n  LOCATION\n  PROVIDER\n}\n\nenum COMMON_REGEX_PATTERN {\n  EMAIL\n  DOMAIN\n}\n';

	const expected: Api<GraphQLApiCustom> = new Api<GraphQLApiCustom>(
		expectedSchema,
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

	const actual = mergeApis([], userApi, productApi, reviewsApi, inventoryApi);
	expect(actual.Schema).toMatchSnapshot('merged_schema');
	expect(pretty(actual)).toMatchSnapshot('merged_apis');
});

test('Should collide because weather and countries API has an enum called Language', async () => {
	const weatherApi = new GraphQLApi(
		'directive @cacheControl(maxAge: Int, scope: CacheControlScope) on FIELD_DEFINITION | OBJECT | INTERFACE\n\ndirective @fromClaim(name: Claim) on VARIABLE_DEFINITION\n\ndirective @hooksVariable on VARIABLE_DEFINITION\n\ndirective @jsonSchema(\n  """\n  The value of both of these keywords MUST be a string.\n  \n  Both of these keywords can be used to decorate a user interface with\n  information about the data produced by this user interface.  A title\n  will preferably be short, whereas a description will provide\n  explanation about the purpose of the instance described by this\n  schema.\n  """\n  title: String\n  """\n  The value of both of these keywords MUST be a string.\n  \n  Both of these keywords can be used to decorate a user interface with\n  information about the data produced by this user interface.  A title\n  will preferably be short, whereas a description will provide\n  explanation about the purpose of the instance described by this\n  schema.\n  """\n  description: String\n  """\n  The value of "multipleOf" MUST be a number, strictly greater than 0.\n  \n  A numeric instance is valid only if division by this keyword\'s value\n  results in an integer.\n  """\n  multipleOf: Int\n  """\n  The value of "maximum" MUST be a number, representing an inclusive\n  upper limit for a numeric instance.\n  \n  If the instance is a number, then this keyword validates only if the\n  instance is less than or exactly equal to "maximum".\n  """\n  maximum: Int\n  """\n  The value of "exclusiveMaximum" MUST be number, representing an\n  exclusive upper limit for a numeric instance.\n  \n  If the instance is a number, then the instance is valid only if it\n  has a value strictly less than (not equal to) "exclusiveMaximum".\n  """\n  exclusiveMaximum: Int\n  """\n  The value of "minimum" MUST be a number, representing an inclusive\n  lower limit for a numeric instance.\n  \n  If the instance is a number, then this keyword validates only if the\n  instance is greater than or exactly equal to "minimum".\n  """\n  minimum: Int\n  """\n  The value of "exclusiveMinimum" MUST be number, representing an\n  exclusive lower limit for a numeric instance.\n  \n  If the instance is a number, then the instance is valid only if it\n  has a value strictly greater than (not equal to) "exclusiveMinimum".\n  """\n  exclusiveMinimum: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  A string instance is valid against this keyword if its length is less\n  than, or equal to, the value of this keyword.\n  \n  The length of a string instance is defined as the number of its\n  characters as defined by RFC 7159 [RFC7159].\n  """\n  maxLength: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  A string instance is valid against this keyword if its length is\n  greater than, or equal to, the value of this keyword.\n  \n  The length of a string instance is defined as the number of its\n  characters as defined by RFC 7159 [RFC7159].\n  \n  Omitting this keyword has the same behavior as a value of 0.\n  """\n  minLength: Int\n  """\n  The value of this keyword MUST be a string.  This string SHOULD be a\n  valid regular expression, according to the ECMA 262 regular\n  expression dialect.\n  \n  A string instance is considered valid if the regular expression\n  matches the instance successfully.  Recall: regular expressions are\n  not implicitly anchored.\n  """\n  pattern: String\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  An array instance is valid against "maxItems" if its size is less\n  than, or equal to, the value of this keyword.\n  """\n  maxItems: Int\n  """\n  The value of this keyword MUST be a non-negative integer.\n  \n  An array instance is valid against "minItems" if its size is greater\n  than, or equal to, the value of this keyword.\n  \n  Omitting this keyword has the same behavior as a value of 0.\n  """\n  minItems: Int\n  """\n  The value of this keyword MUST be a boolean.\n  \n  If this keyword has boolean value false, the instance validates\n  successfully.  If it has boolean value true, the instance validates\n  successfully if all of its elements are unique.\n  \n  Omitting this keyword has the same behavior as a value of false.\n  """\n  uniqueItems: Boolean\n  commonPattern: COMMON_REGEX_PATTERN\n) on VARIABLE_DEFINITION\n\ndirective @rbac(\n  """the user must match all roles"""\n  requireMatchAll: [WG_ROLE]\n  """the user must match at least one of the roles"""\n  requireMatchAny: [WG_ROLE]\n  """the user must not match all of the roles"""\n  denyMatchAll: [WG_ROLE]\n  """the user must not match any of the roles"""\n  denyMatchAny: [WG_ROLE]\n) on QUERY | MUTATION | SUBSCRIPTION\n\n"""\nThe directive @injectCurrentDateTime injects a DateTime string of the current date and time into the variable.\nThis variable MUST be a string compatible scalar. \n\nThe default format, is: ISO 8601\nIf no format is chosen, the default format is used.\nCustom formats are allowed by specifying a format conforming to the Golang specification for specifying a date time format.\n"""\ndirective @injectCurrentDateTime(\n  format: WunderGraphDateTimeFormat = ISO8601\n  """\n  customFormat must conform to the Golang specification for specifying a date time format\n  """\n  customFormat: String\n) on VARIABLE_DEFINITION\n\n"""\nThe directive @injectGeneratedUUID injects a generated UUID into the variable.\nThis variable MUST be a string.\nAt the same time, it removes the variable from the input definition,\ndisallowing the user to supply it.\n\nThis means, the UUID is 100% generated server-side and can be considered untempered.\n"""\ndirective @injectGeneratedUUID on VARIABLE_DEFINITION\n\n"""\nThe @internalOperation Directive marks an Operation as internal.\nBy doing so, the Operation is no longer accessible from the public API.\nIt can only be accessed by internal services, like hooks.\n"""\ndirective @internalOperation on QUERY | MUTATION | SUBSCRIPTION\n\n"""\nThe directive @injectEnvironmentVariable allows you to inject an environment variable into the variable definition.\n"""\ndirective @injectEnvironmentVariable(name: String!) on VARIABLE_DEFINITION\n\n"""\nThe @export directive instructs the Execution Planner to export the field during the execution into the variable of the \'as\' argument.\nAs the execution is depth first, a field can only be used after it has been exported.\nAdditionally, a field can only be used after using the \'_join\' field or on a different data source.\nIt\'s not possible to export a field and use it in for the same data source.\n\nNote that the @export directive only works on fields that return a single value.\nIt\'s not possible to export a list or object field.\n"""\ndirective @export(\n  """The argument \'as\' is the name of the variable to export the field to."""\n  as: String!\n) on FIELD\n\n"""\nThe directive @internal marks a variable definition as internal so that clients can\'t access it.\nThe field is also not visible in the public API.\nIt\'s only being used as an internal variable to export fields into.\n"""\ndirective @internal on VARIABLE_DEFINITION\n\n"""\nThe @transform directive allows to apply transformations to the response.\nBy applying the directive, the shape of the response can be altered,\nwhich will also modify the JSON-Schema of the response.\nThat is, you will keep full type safety and code-generation for transformed fields.\n"""\ndirective @transform(\n  """\n  Using the \'get\' transformation allows you to extract a nested field using a JSON path.\n  This is useful to unnest data, e.g. when using the \'_join\' field, which adds an extra layer of nesting.\n  \n  Example:\n  \n  query GetName {\n      name: me @transform(get: "info.name") {\n          info {\n              name\n          }\n      }\n  }\n  \n  Before the transformation, the resolve looks like this:\n  \n  {\n      "name": {\n          "info": {\n              "name": "John Doe"\n          }\n      }\n  }\n  \n  With the transformation applied, the response will be reshaped like this:\n  \n  {\n      "name": "John Doe"\n  }\n  """\n  get: String\n) on FIELD\n\ntype City {\n  id: ID\n  name: String\n  country: String\n  coord: Coordinates\n  weather: Weather\n  _join: Query!\n}\n\ntype Coordinates {\n  lon: Float\n  lat: Float\n  _join: Query!\n}\n\ntype Summary {\n  title: String\n  description: String\n  icon: String\n  _join: Query!\n}\n\ntype Temperature {\n  actual: Float\n  feelsLike: Float\n  min: Float\n  max: Float\n  _join: Query!\n}\n\ntype Wind {\n  speed: Float\n  deg: Int\n  _join: Query!\n}\n\ntype Clouds {\n  all: Int\n  visibility: Int\n  humidity: Int\n  _join: Query!\n}\n\ntype Weather {\n  summary: Summary\n  temperature: Temperature\n  wind: Wind\n  clouds: Clouds\n  timestamp: Int\n  _join: Query!\n}\n\ninput ConfigInput {\n  units: Unit\n  lang: Language\n}\n\ntype Query {\n  getCityByName(name: String!, country: String, config: ConfigInput): City\n  getCityById(id: [String!], config: ConfigInput): [City]\n}\n\nenum Unit {\n  metric\n  imperial\n  kelvin\n}\n\nenum Language {\n  af\n  al\n  ar\n  az\n  bg\n  ca\n  cz\n  da\n  de\n  el\n  en\n  eu\n  fa\n  fi\n  fr\n  gl\n  he\n  hi\n  hr\n  hu\n  id\n  it\n  ja\n  kr\n  la\n  lt\n  mk\n  no\n  nl\n  pl\n  pt\n  pt_br\n  ro\n  ru\n  sv\n  se\n  sk\n  sl\n  sp\n  es\n  sr\n  th\n  tr\n  ua\n  uk\n  vi\n  zh_cn\n  zh_tw\n  zu\n}\n\nenum CacheControlScope {\n  PUBLIC\n  PRIVATE\n}\n\n"""The `Upload` scalar type represents a file upload."""\nscalar Upload\n\nenum Claim {\n  EMAIL\n  EMAIL_VERIFIED\n  NAME\n  NICKNAME\n  LOCATION\n  PROVIDER\n}\n\nenum COMMON_REGEX_PATTERN {\n  EMAIL\n  DOMAIN\n}\n\nenum WG_ROLE {\n  admin\n  user\n}\n\nenum WunderGraphDateTimeFormat {\n  """2006-01-02T15:04:05-0700"""\n  ISO8601\n  """Mon Jan _2 15:04:05 2006"""\n  ANSIC\n  """Mon Jan _2 15:04:05 MST 2006"""\n  UnixDate\n  """Mon Jan 02 15:04:05 -0700 2006"""\n  RubyDate\n  """02 Jan 06 15:04 MST"""\n  RFC822\n  """02 Jan 06 15:04 -0700"""\n  RFC822Z\n  """Monday, 02-Jan-06 15:04:05 MST"""\n  RFC850\n  """Mon, 02 Jan 2006 15:04:05 MST"""\n  RFC1123\n  """Mon, 02 Jan 2006 15:04:05 -0700"""\n  RFC1123Z\n  """2006-01-02T15:04:05Z07:00"""\n  RFC3339\n  """2006-01-02T15:04:05.999999999Z07:00"""\n  RFC3339Nano\n  """3:04PM"""\n  Kitchen\n  """Jan _2 15:04:05"""\n  Stamp\n  """Jan _2 15:04:05.000"""\n  StampMilli\n  """Jan _2 15:04:05.000000"""\n  StampMicro\n  """Jan _2 15:04:05.000000000"""\n  StampNano\n}',

		[
			{
				Kind: DataSourceKind.GRAPHQL,
				RootNodes: [
					{
						typeName: 'Query',
						fieldNames: ['getCityByName', 'getCityById'],
					},
				],
				ChildNodes: [
					{
						typeName: 'City',
						fieldNames: ['id', 'name', 'country', 'coord', 'weather'],
					},
					{
						typeName: 'Coordinates',
						fieldNames: ['lon', 'lat'],
					},
					{
						typeName: 'Summary',
						fieldNames: ['title', 'description', 'icon'],
					},
					{
						typeName: 'Temperature',
						fieldNames: ['actual', 'feelsLike', 'min', 'max'],
					},
					{
						typeName: 'Wind',
						fieldNames: ['speed', 'deg'],
					},
					{
						typeName: 'Clouds',
						fieldNames: ['all', 'visibility', 'humidity'],
					},
					{
						typeName: 'Weather',
						fieldNames: ['summary', 'temperature', 'wind', 'clouds', 'timestamp'],
					},
				],
				Custom: {
					Federation: {
						Enabled: false,
						ServiceSDL: '',
					},
					Subscription: {
						Enabled: false,
						URL: mapInputVariable(''),
						UseSSE: false,
					},
					Fetch: {
						url: mapInputVariable('https://graphql-weather-api.herokuapp.com'),
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
					UpstreamSchema:
						'directive @cacheControl(maxAge: Int, scope: CacheControlScope) on FIELD_DEFINITION | OBJECT | INTERFACE\n\ntype City {\n  id: ID\n  name: String\n  country: String\n  coord: Coordinates\n  weather: Weather\n}\n\ntype Coordinates {\n  lon: Float\n  lat: Float\n}\n\ntype Summary {\n  title: String\n  description: String\n  icon: String\n}\n\ntype Temperature {\n  actual: Float\n  feelsLike: Float\n  min: Float\n  max: Float\n}\n\ntype Wind {\n  speed: Float\n  deg: Int\n}\n\ntype Clouds {\n  all: Int\n  visibility: Int\n  humidity: Int\n}\n\ntype Weather {\n  summary: Summary\n  temperature: Temperature\n  wind: Wind\n  clouds: Clouds\n  timestamp: Int\n}\n\ninput ConfigInput {\n  units: Unit\n  lang: Language\n}\n\ntype Query {\n  getCityByName(name: String!, country: String, config: ConfigInput): City\n  getCityById(id: [String!], config: ConfigInput): [City]\n}\n\nenum Unit {\n  metric\n  imperial\n  kelvin\n}\n\nenum Language {\n  af\n  al\n  ar\n  az\n  bg\n  ca\n  cz\n  da\n  de\n  el\n  en\n  eu\n  fa\n  fi\n  fr\n  gl\n  he\n  hi\n  hr\n  hu\n  id\n  it\n  ja\n  kr\n  la\n  lt\n  mk\n  no\n  nl\n  pl\n  pt\n  pt_br\n  ro\n  ru\n  sv\n  se\n  sk\n  sl\n  sp\n  es\n  sr\n  th\n  tr\n  ua\n  uk\n  vi\n  zh_cn\n  zh_tw\n  zu\n}\n\nenum CacheControlScope {\n  PUBLIC\n  PRIVATE\n}\n\n"""The `Upload` scalar type represents a file upload."""\nscalar Upload',
				},
				Directives: [],
				TimeoutMilliseconds: 0,
			},
		],
		[],
		[],
		[]
	);
	const raw =
		'{"organization":"wundergraph","name":"countries","keywords":["countries"],"shortDescription":"Countries API","markdownDescription":"","repositoryUrl":"","sdkVersion":"","definition":{"DataSources":[{"ChildNodes":[{"fieldNames":["code","name","native","phone","continent","capital","currency","languages","emoji","emojiU","states"],"typeName":"Country"},{"fieldNames":["code","name","countries"],"typeName":"Continent"},{"fieldNames":["code","name","native","rtl"],"typeName":"Language"},{"fieldNames":["code","name","country"],"typeName":"State"}],"Custom":{"Federation":{"Enabled":true,"ServiceSDL":"type Country @key(fields: \\"code\\") {\\n  code: ID!\\n  name: String!\\n  native: String!\\n  phone: String!\\n  continent: Continent!\\n  capital: String\\n  currency: String\\n  languages: [Language!]!\\n  emoji: String!\\n  emojiU: String!\\n  states: [State!]!\\n}\\n\\ntype Continent @key(fields: \\"code\\") {\\n  code: ID!\\n  name: String!\\n  countries: [Country!]!\\n}\\n\\ntype Language @key(fields: \\"code\\") {\\n  code: ID!\\n  name: String\\n  native: String\\n  rtl: Boolean!\\n}\\n\\ntype State {\\n  code: String\\n  name: String!\\n  country: Country!\\n}\\n\\ninput StringQueryOperatorInput {\\n  eq: String\\n  ne: String\\n  in: [String]\\n  nin: [String]\\n  regex: String\\n  glob: String\\n}\\n\\ninput CountryFilterInput {\\n  code: StringQueryOperatorInput\\n  currency: StringQueryOperatorInput\\n  continent: StringQueryOperatorInput\\n}\\n\\ninput ContinentFilterInput {\\n  code: StringQueryOperatorInput\\n}\\n\\ninput LanguageFilterInput {\\n  code: StringQueryOperatorInput\\n}\\n\\ntype Query {\\n  countries(filter: CountryFilterInput): [Country!]!\\n  country(code: ID!): Country\\n  continents(filter: ContinentFilterInput): [Continent!]!\\n  continent(code: ID!): Continent\\n  languages(filter: LanguageFilterInput): [Language!]!\\n  language(code: ID!): Language\\n}\\n"},"Fetch":{"body":{"environmentVariableDefaultValue":"","environmentVariableName":"","kind":0,"placeholderVariableName":"","staticVariableContent":""},"header":{},"method":1,"query":[],"url":{"environmentVariableDefaultValue":"","environmentVariableName":"","kind":0,"placeholderVariableName":"","staticVariableContent":"https://countries.trevorblades.com/graphql"},"urlEncodeBody":false},"Subscription":{"Enabled":false,"URL":{"environmentVariableDefaultValue":"","environmentVariableName":"","kind":0,"placeholderVariableName":"","staticVariableContent":"wss://countries.trevorblades.com/graphql"}},"UpstreamSchema":"type Country {\\n  code: ID!\\n  name: String!\\n  native: String!\\n  phone: String!\\n  continent: Continent!\\n  capital: String\\n  currency: String\\n  languages: [Language!]!\\n  emoji: String!\\n  emojiU: String!\\n  states: [State!]!\\n}\\n\\ntype Continent {\\n  code: ID!\\n  name: String!\\n  countries: [Country!]!\\n}\\n\\ntype Language {\\n  code: ID!\\n  name: String\\n  native: String\\n  rtl: Boolean!\\n}\\n\\ntype State {\\n  code: String\\n  name: String!\\n  country: Country!\\n}\\n\\ninput StringQueryOperatorInput {\\n  eq: String\\n  ne: String\\n  in: [String]\\n  nin: [String]\\n  regex: String\\n  glob: String\\n}\\n\\ninput CountryFilterInput {\\n  code: StringQueryOperatorInput\\n  currency: StringQueryOperatorInput\\n  continent: StringQueryOperatorInput\\n}\\n\\ninput ContinentFilterInput {\\n  code: StringQueryOperatorInput\\n}\\n\\ninput LanguageFilterInput {\\n  code: StringQueryOperatorInput\\n}\\n\\ntype Query {\\n  countries(filter: CountryFilterInput): [Country!]!\\n  country(code: ID!): Country\\n  continents(filter: ContinentFilterInput): [Continent!]!\\n  continent(code: ID!): Continent\\n  languages(filter: LanguageFilterInput): [Language!]!\\n  language(code: ID!): Language\\n}\\n"},"Directives":[],"Kind":2,"RootNodes":[{"fieldNames":["code","name","native","phone","continent","capital","currency","languages","emoji","emojiU","states"],"typeName":"Country"},{"fieldNames":["code","name","countries"],"typeName":"Continent"},{"fieldNames":["code","name","native","rtl"],"typeName":"Language"},{"fieldNames":["countries","country","continents","continent","languages","language"],"typeName":"Query"}]}],"DefaultFlushInterval":500,"Fields":[{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"name","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"native","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"phone","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"continent","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"capital","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"currency","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"languages","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"emoji","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"emojiU","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"states","path":[],"requiresFields":["code"],"typeName":"Country","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"name","path":[],"requiresFields":["code"],"typeName":"Continent","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"countries","path":[],"requiresFields":["code"],"typeName":"Continent","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"name","path":[],"requiresFields":["code"],"typeName":"Language","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"native","path":[],"requiresFields":["code"],"typeName":"Language","unescapeResponseJson":false},{"argumentsConfiguration":[],"disableDefaultFieldMapping":false,"fieldName":"rtl","path":[],"requiresFields":["code"],"typeName":"Language","unescapeResponseJson":false},{"argumentsConfiguration":[{"name":"filter","renderConfiguration":0,"sourcePath":[],"sourceType":1}],"disableDefaultFieldMapping":false,"fieldName":"countries","path":[],"requiresFields":[],"typeName":"Query","unescapeResponseJson":false},{"argumentsConfiguration":[{"name":"code","renderConfiguration":0,"sourcePath":[],"sourceType":1}],"disableDefaultFieldMapping":false,"fieldName":"country","path":[],"requiresFields":[],"typeName":"Query","unescapeResponseJson":false},{"argumentsConfiguration":[{"name":"filter","renderConfiguration":0,"sourcePath":[],"sourceType":1}],"disableDefaultFieldMapping":false,"fieldName":"continents","path":[],"requiresFields":[],"typeName":"Query","unescapeResponseJson":false},{"argumentsConfiguration":[{"name":"code","renderConfiguration":0,"sourcePath":[],"sourceType":1}],"disableDefaultFieldMapping":false,"fieldName":"continent","path":[],"requiresFields":[],"typeName":"Query","unescapeResponseJson":false},{"argumentsConfiguration":[{"name":"filter","renderConfiguration":0,"sourcePath":[],"sourceType":1}],"disableDefaultFieldMapping":false,"fieldName":"languages","path":[],"requiresFields":[],"typeName":"Query","unescapeResponseJson":false},{"argumentsConfiguration":[{"name":"code","renderConfiguration":0,"sourcePath":[],"sourceType":1}],"disableDefaultFieldMapping":false,"fieldName":"language","path":[],"requiresFields":[],"typeName":"Query","unescapeResponseJson":false}],"Schema":"\\"\\"\\"The directive @internal marks a variable definition as internal so that clients can\'t access it.\\nThe field is also not visible in the public API.\\nIt\'s only being used as an internal variable to export fields into.\\"\\"\\" directive@internal on VARIABLE_DEFINITION \\"\\"\\"The @transform directive allows to apply transformations to the response.\\nBy applying the directive, the shape of the response can be altered,\\nwhich will also modify the JSON-Schema of the response.\\nThat is, you will keep full type safety and code-generation for transformed fields.\\"\\"\\" directive@transform(\\"\\"\\"Using the \'get\' transformation allows you to extract a nested field using a JSON path.\\nThis is useful to unnest data, e.g. when using the \'_join\' field, which adds an extra layer of nesting.\\n\\nExample:\\n\\nquery GetName {\\n    name: me @transform(get: \\"info.name\\") {\\n        info {\\n            name\\n        }\\n    }\\n}\\n\\nBefore the transformation, the resolve looks like this:\\n\\n{\\n    \\"name\\": {\\n        \\"info\\": {\\n            \\"name\\": \\"John Doe\\"\\n        }\\n    }\\n}\\n\\nWith the transformation applied, the response will be reshaped like this:\\n\\n{\\n    \\"name\\": \\"John Doe\\"\\n}\\"\\"\\" get:String)on FIELD type Country{code:ID!name:String!native:String!phone:String!continent:Continent!capital:String currency:String languages:[Language!]!emoji:String!emojiU:String!states:[State!]!}type Continent{code:ID!name:String!countries:[Country!]!}type Language{code:ID!name:String native:String rtl:Boolean!}type State{code:String name:String!country:Country!}input StringQueryOperatorInput{eq:String ne:String in:[String]nin:[String]regex:String glob:String}input CountryFilterInput{code:StringQueryOperatorInput currency:StringQueryOperatorInput continent:StringQueryOperatorInput}input ContinentFilterInput{code:StringQueryOperatorInput}input LanguageFilterInput{code:StringQueryOperatorInput}type Query{countries(filter:CountryFilterInput):[Country!]!country(code:ID!):Country continents(filter:ContinentFilterInput):[Continent!]!continent(code:ID!):Continent languages(filter:LanguageFilterInput):[Language!]!language(code:ID!):Language}","Types":[],"interpolateVariableDefinitionAsJSON":[]},"isPublic":true,"placeholders":[]}';
	const countriesAPI = await resolveIntegration(raw, {});

	expect(() => {
		mergeApis([], weatherApi, countriesAPI);
	}).toThrowError(
		'Schemas could not be merged. Define namespaces on the APIs to avoid type collisions. Error: Language.af defined in resolvers, but not in schema'
	);
});

const pretty = (input: any) => {
	return JSON.stringify(input, null, '  ');
};
