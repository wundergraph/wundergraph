import { Api, ApiIntrospectionOptions, DataSource, NatsKvApi, NatsKvApiCustom } from './index';
import { ConfigurationVariableKind, DataSourceKind, FieldConfiguration, NatsKvOperation } from '@wundergraph/protobuf';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { getGraphqlSchemaFromJsonSchema } from 'get-graphql-from-jsonschema';
import { TranslatableJsonSchema } from 'get-graphql-from-jsonschema/build/lib/Types/TranslatableJsonSchema';
import {
	applyNameSpaceToFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
} from './namespacing';
import { buildSchema } from 'graphql';

const WgNatsEmbeddedServerURLKey = 'WG_NATS_EMBEDDED_SERVER_URL';

export interface NatsKVIntrospection {
	apiNamespace: string;
	model: z.AnyZodObject;
	history?: number;
	serverURL?: string;
	token?: string;
}

export const introspectNatsKV = async (introspection: NatsKVIntrospection) => {
	return async (options: ApiIntrospectionOptions): Promise<Api<NatsKvApiCustom>> => {
		const modelJsonSchema = zodToJsonSchema(introspection.model);
		const inputSchema = getGraphqlSchemaFromJsonSchema({
			schema: modelJsonSchema as TranslatableJsonSchema,
			rootName: 'InputValue',
			direction: 'input',
		});
		const outputSchema = getGraphqlSchemaFromJsonSchema({
			schema: modelJsonSchema as TranslatableJsonSchema,
			rootName: 'Value',
			direction: 'output',
		});
		let serverURL = introspection.serverURL;
		if (serverURL === undefined) {
			const builtinNatsServerURL = process.env[WgNatsEmbeddedServerURLKey];
			if (!builtinNatsServerURL) {
				throw new Error(`could not determine builtin NATS server URL, ${WgNatsEmbeddedServerURLKey} is empty`);
			}
			serverURL = builtinNatsServerURL;
		}
		const inputOutput = [...inputSchema.typeDefinitions, ...outputSchema.typeDefinitions];
		const unnamespacedSchema = kvTemplate + inputOutput.join('\n\n').replace(new RegExp('T0', 'g'), '');
		const graphqlSchema = buildSchema(unnamespacedSchema);
		const schema = applyNameSpaceToGraphQLSchema(unnamespacedSchema, [], introspection.apiNamespace);
		const dataSource: DataSource<NatsKvApiCustom> = {
			RootNodes: applyNameSpaceToTypeFields([], graphqlSchema, introspection.apiNamespace),
			ChildNodes: [],
			Directives: [],
			Kind: DataSourceKind.NATSKV,
			Custom: {
				bucketPrefix: {
					kind: ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE,
					environmentVariableName: 'WG_NATS_PREFIX',
					environmentVariableDefaultValue: '',
					placeholderVariableName: '',
					staticVariableContent: '',
				},
				serverURL,
				token: introspection.token ?? '',
				history: introspection.history ?? 1,
				bucketName: introspection.apiNamespace,
				operation: NatsKvOperation.NATSKV_GET,
				schema: modelJsonSchema,
			},
			RequestTimeoutSeconds: 10,
		};
		const dataSources: DataSource<NatsKvApiCustom>[] = [];
		const queryFields: operation[] = ['get', 'getRevision', 'keys', 'history'];
		const mutationFields: operation[] = ['put', 'create', 'update', 'delete', 'purge'];
		const subscriptionFields: operation[] = ['watch', 'watchAll'];
		const fields: FieldConfiguration[] = [];
		for (const field of queryFields) {
			dataSources.push({
				...dataSource,
				RootNodes: applyNameSpaceToTypeFields(
					[{ typeName: 'Query', fieldNames: [field] }],
					graphqlSchema,
					introspection.apiNamespace
				),
				Custom: {
					...dataSource.Custom,
					operation: operationMapper(field),
				},
			});
			fields.push({
				typeName: 'Query',
				fieldName: field,
				disableDefaultFieldMapping: true,
				unescapeResponseJson: false,
				requiresFields: [],
				path: [],
				argumentsConfiguration: [],
			});
		}
		for (const field of mutationFields) {
			dataSources.push({
				...dataSource,
				RootNodes: applyNameSpaceToTypeFields(
					[{ typeName: 'Mutation', fieldNames: [field] }],
					graphqlSchema,
					introspection.apiNamespace
				),
				Custom: {
					...dataSource.Custom,
					operation: operationMapper(field),
				},
			});
			fields.push({
				typeName: 'Mutation',
				fieldName: field,
				disableDefaultFieldMapping: true,
				unescapeResponseJson: false,
				requiresFields: [],
				path: [],
				argumentsConfiguration: [],
			});
		}
		for (const field of subscriptionFields) {
			dataSources.push({
				...dataSource,
				RootNodes: applyNameSpaceToTypeFields(
					[{ typeName: 'Subscription', fieldNames: [field] }],
					graphqlSchema,
					introspection.apiNamespace
				),
				Custom: {
					...dataSource.Custom,
					operation: operationMapper(field),
				},
			});
			fields.push({
				typeName: 'Subscription',
				fieldName: field,
				disableDefaultFieldMapping: true,
				unescapeResponseJson: false,
				requiresFields: [],
				path: [],
				argumentsConfiguration: [],
			});
		}
		return new NatsKvApi(
			schema,
			introspection.apiNamespace,
			dataSources,
			applyNameSpaceToFieldConfigurations(fields, graphqlSchema, [], introspection.apiNamespace),
			[],
			[]
		);
	};
};

type operation =
	| 'get'
	| 'getRevision'
	| 'keys'
	| 'history'
	| 'put'
	| 'create'
	| 'update'
	| 'delete'
	| 'purge'
	| 'watch'
	| 'watchAll';

const operationMapper = (operation: operation): NatsKvOperation => {
	switch (operation) {
		case 'get':
			return NatsKvOperation.NATSKV_GET;
		case 'getRevision':
			return NatsKvOperation.NATSKV_GETREVISION;
		case 'keys':
			return NatsKvOperation.NATSKV_KEYS;
		case 'history':
			return NatsKvOperation.NATSKV_HISTORY;
		case 'put':
			return NatsKvOperation.NATSKV_PUT;
		case 'create':
			return NatsKvOperation.NATSKV_CREATE;
		case 'update':
			return NatsKvOperation.NATSKV_UPDATE;
		case 'delete':
			return NatsKvOperation.NATSKV_DELETE;
		case 'purge':
			return NatsKvOperation.NATSKV_PURGE;
		case 'watch':
			return NatsKvOperation.NATSKV_WATCH;
		case 'watchAll':
			return NatsKvOperation.NATSKV_WATCHALL;
		default:
			throw new Error(`Unknown operation ${operation}`);
	}
};

const kvTemplate = `
schema {
	query: Query
	mutation: Mutation
	subscription: Subscription
}

type Query {
  "Get returns the latest value for the key."
  get(key: String!): KeyValueEntry
  "GetRevision returns a specific revision value for the key."
  getRevision(key: String!, revision: Int!): KeyValueEntry
  "Keys will return all keys."
  keys: [String!]!
  "History will return all historical values for the key."
  history(key: String!): [KeyValueEntry!]!
}

type Mutation {
  "Put will place the new value for the key into the store."
  put(key: String!, value: InputValue!): KeyValueEntry
  "Create will add the key/value pair iff it does not exist."
  create(key: String!, value: InputValue!): KeyValueEntry
  "Update will update the value iff the latest revision matches."
  update(key: String!, value: InputValue!, revision: Int!): KeyValueEntry
  "Delete will place a delete marker and leave all revisions."
  delete(key: String!): Boolean!
  "Purge will place a delete marker and remove all previous revisions."
  purge(key: String!): Boolean!
}

type Subscription {
  """
    Watch for any updates to keys that match the keys argument which could include wildcards.
	  Watch will send a nil entry when it has received all initial values.
	"""
	watch(keys: [String!]!): [KeyValueEntry!]!
	"WatchAll will invoke the callback for all updates."
	watchAll: [KeyValueEntry!]!
}

type KeyValueEntry {
	key: String!
	value: Value
	revision: Int!
	created: Int!
}

`;
