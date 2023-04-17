import { assert } from 'chai';
import { GraphQLApi } from '../definition';
import { parse, print } from 'graphql';
import { ArgumentRenderConfiguration, ArgumentSource, DataSourceKind, HTTPMethod } from '@wundergraph/protobuf';
import transformApi from './index';
import { mapInputVariable } from '../configure/variables';

test('renameTypes', async () => {
	const schema = `type User {name: String!} type Query {me: User!}`;
	const api = new Promise<GraphQLApi>((resolve) => {
		resolve(
			new GraphQLApi(
				schema,
				[
					{
						RootNodes: [
							{
								typeName: 'Query',
								fieldNames: ['me'],
							},
						],
						ChildNodes: [
							{
								typeName: 'User',
								fieldNames: ['name'],
							},
						],
						Kind: DataSourceKind.GRAPHQL,
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
								method: HTTPMethod.POST,
								url: mapInputVariable('example.com'),
								baseUrl: mapInputVariable(''),
								path: mapInputVariable(''),
								query: [],
								header: {},
								body: mapInputVariable(''),
								mTLS: undefined,
								upstreamAuthentication: undefined,
								urlEncodeBody: false,
								proxyUrl: mapInputVariable(''),
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
						fieldName: 'name',
						disableDefaultFieldMapping: true,
						argumentsConfiguration: [],
						requiresFields: [],
						path: [],
						unescapeResponseJson: false,
					},
				],
				[],
				[]
			)
		);
	});
	const renamed = (await transformApi.renameTypes(api, {
		from: 'User',
		to: 'PetStore_User',
	})) as GraphQLApi;
	const renamedSchema = print(parse('type PetStore_User {name: String!} type Query {me: PetStore_User!}'));
	const expected = await new GraphQLApi(
		renamedSchema,
		[
			{
				RootNodes: [
					{
						typeName: 'Query',
						fieldNames: ['me'],
					},
				],
				ChildNodes: [
					{
						typeName: 'PetStore_User',
						fieldNames: ['name'],
					},
				],
				Kind: DataSourceKind.GRAPHQL,
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
						method: HTTPMethod.POST,
						url: mapInputVariable('example.com'),
						baseUrl: mapInputVariable(''),
						path: mapInputVariable(''),
						query: [],
						header: {},
						body: mapInputVariable(''),
						mTLS: undefined,
						upstreamAuthentication: undefined,
						urlEncodeBody: false,
						proxyUrl: mapInputVariable(''),
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
				typeName: 'PetStore_User',
				fieldName: 'name',
				disableDefaultFieldMapping: true,
				argumentsConfiguration: [],
				requiresFields: [],
				path: [],
				unescapeResponseJson: false,
			},
		],
		[],
		[]
	);

	assert.equal(pretty(renamed), pretty(expected));
});

test('renameTypeFields', async () => {
	const schema = `type User {name: String!} type Query {me: User!}`;
	const api = new Promise<GraphQLApi>((resolve) => {
		resolve(
			new GraphQLApi(
				schema,
				[
					{
						RootNodes: [
							{
								typeName: 'Query',
								fieldNames: ['me'],
							},
						],
						ChildNodes: [
							{
								typeName: 'User',
								fieldNames: ['name'],
							},
						],
						Kind: DataSourceKind.GRAPHQL,
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
								method: HTTPMethod.POST,
								url: mapInputVariable('example.com'),
								baseUrl: mapInputVariable(''),
								path: mapInputVariable(''),
								query: [],
								header: {},
								body: mapInputVariable(''),
								mTLS: undefined,
								upstreamAuthentication: undefined,
								urlEncodeBody: false,
								proxyUrl: mapInputVariable(''),
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
						fieldName: 'me',
						disableDefaultFieldMapping: true,
						argumentsConfiguration: [],
						requiresFields: [],
						path: ['me'],
						unescapeResponseJson: false,
					},
					{
						typeName: 'Query',
						fieldName: 'other',
						disableDefaultFieldMapping: true,
						argumentsConfiguration: [
							{
								name: 'arg',
								sourceType: ArgumentSource.OBJECT_FIELD,
								sourcePath: ['me'],
								renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_DEFAULT,
								renameTypeTo: '',
							},
						],
						requiresFields: ['me'],
						path: [],
						unescapeResponseJson: false,
					},
				],
				[],
				[]
			)
		);
	});
	const renamed = (await transformApi.renameFields(api, {
		typeName: 'Query',
		fromFieldName: 'me',
		toFieldName: 'user',
	})) as GraphQLApi;
	const updatedSchema = print(parse(`type User {name: String!} type Query {user: User!}`));
	const expected = await new Promise<GraphQLApi>((resolve) => {
		resolve(
			new GraphQLApi(
				updatedSchema,
				[
					{
						RootNodes: [
							{
								typeName: 'Query',
								fieldNames: ['user'],
							},
						],
						ChildNodes: [
							{
								typeName: 'User',
								fieldNames: ['name'],
							},
						],
						Kind: DataSourceKind.GRAPHQL,
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
								method: HTTPMethod.POST,
								url: mapInputVariable('example.com'),
								baseUrl: mapInputVariable(''),
								path: mapInputVariable(''),
								query: [],
								header: {},
								body: mapInputVariable(''),
								upstreamAuthentication: undefined,
								mTLS: undefined,
								urlEncodeBody: false,
								proxyUrl: mapInputVariable(''),
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
						fieldName: 'user',
						disableDefaultFieldMapping: true,
						argumentsConfiguration: [],
						requiresFields: [],
						path: ['user'],
						unescapeResponseJson: false,
					},
					{
						typeName: 'Query',
						fieldName: 'other',
						disableDefaultFieldMapping: true,
						argumentsConfiguration: [
							{
								name: 'arg',
								sourceType: ArgumentSource.OBJECT_FIELD,
								sourcePath: ['user'],
								renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_DEFAULT,
								renameTypeTo: '',
							},
						],
						requiresFields: ['user'],
						path: [],
						unescapeResponseJson: false,
					},
				],
				[],
				[]
			)
		);
	});

	assert.equal(pretty(renamed), pretty(expected));
});

const pretty = (input: any) => {
	return JSON.stringify(input, null, '  ');
};
