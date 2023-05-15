import { IntrospectionCacheConfiguration, introspectWithCache } from './introspection-cache';
import { DatabaseSchema, mongodb, mysql, planetscale, postgresql, prisma, sqlite, sqlserver } from '../db/types';
import {
	Api,
	ApiIntrospectionOptions,
	ApiType,
	DatabaseApiCustom,
	DatabaseIntrospection,
	DataSource,
	MongoDBApi,
	MySQLApi,
	PlanetscaleApi,
	PostgresqlApi,
	PrismaApi,
	PrismaIntrospection,
	SQLiteApi,
	SQLServerApi,
} from './index';
import { introspectPrismaDatabaseWithRetries } from '../db/introspection';
import { buildSchema, parse, print } from 'graphql/index';
import { configuration } from '../graphql/configuration';
import {
	applyNameSpaceToFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
	generateTypeConfigurationsForNamespace,
} from './namespacing';
import { mapInputVariable, resolveVariable } from '../configure/variables';
import { DataSourceKind, FieldConfiguration, SingleTypeField, TypeConfiguration } from '@wundergraph/protobuf';
import { fileHash, urlHash } from '../localcache';

const introspectDatabase = async (
	introspection: DatabaseIntrospection,
	databaseSchema: DatabaseSchema,
	maxRetries: number
) => {
	const {
		success,
		message,
		graphql_schema,
		prisma_schema,
		interpolateVariableDefinitionAsJSON,
		jsonTypeFields,
		jsonResponseFields,
	} = await introspectPrismaDatabaseWithRetries(introspection, databaseSchema, maxRetries);
	if (!success) {
		return Promise.reject(message);
	}
	const schemaDocumentNode = parse(graphql_schema);
	const schema = print(schemaDocumentNode);
	const { RootNodes, ChildNodes, Fields } = configuration(schemaDocumentNode, {
		url: '',
		schemaExtension: introspection.schemaExtension,
	});
	const jsonFields = [...jsonTypeFields, ...jsonResponseFields];
	jsonFields.forEach((field) => {
		const fieldConfig = Fields.find((f) => f.typeName == field.typeName && f.fieldName == field.fieldName);
		if (fieldConfig) {
			fieldConfig.unescapeResponseJson = true;
		} else {
			Fields.push({
				fieldName: field.fieldName,
				typeName: field.typeName,
				unescapeResponseJson: true,
				argumentsConfiguration: [],
				path: [],
				requiresFields: [],
				disableDefaultFieldMapping: false,
			});
		}
	});
	const graphQLSchema = buildSchema(schema);
	const dataSource: DataSource<DatabaseApiCustom> = {
		Kind: databaseSchemaToKind(databaseSchema),
		RootNodes: applyNameSpaceToTypeFields(RootNodes, graphQLSchema, introspection.apiNamespace),
		ChildNodes: applyNameSpaceToTypeFields(ChildNodes, graphQLSchema, introspection.apiNamespace),
		Custom: {
			prisma_schema: prisma_schema,
			databaseURL: mapInputVariable(introspection.databaseURL),
			graphql_schema: schema,
			jsonTypeFields: applyNameSpaceToSingleTypeFields(jsonTypeFields, introspection.apiNamespace),
			jsonInputVariables: applyNameSpaceToTypeNames(interpolateVariableDefinitionAsJSON, introspection.apiNamespace),
		},
		Directives: [],
		RequestTimeoutSeconds: introspection.requestTimeoutSeconds ?? 0,
	};
	const dataSources: DataSource<DatabaseApiCustom>[] = [];
	dataSource.RootNodes.forEach((rootNode) => {
		rootNode.fieldNames.forEach((field) => {
			dataSources.push({
				...Object.assign({}, dataSource),
				RootNodes: [
					{
						typeName: rootNode.typeName,
						fieldNames: [field],
					},
				],
			});
		});
	});
	return {
		schema: applyNameSpaceToGraphQLSchema(schema, [], introspection.apiNamespace),
		dataSources: dataSources,
		fields: applyNameSpaceToFieldConfigurations(Fields, graphQLSchema, [], introspection.apiNamespace),
		types: generateTypeConfigurationsForNamespace(schema, introspection.apiNamespace),
		interpolateVariableDefinitionAsJSON: applyNameSpaceToTypeNames(
			interpolateVariableDefinitionAsJSON,
			introspection.apiNamespace
		),
	};
};

const databaseSchemaToKind = (schema: DatabaseSchema): DataSourceKind => {
	switch (schema) {
		case planetscale:
			return DataSourceKind.MYSQL;
		case mysql:
			return DataSourceKind.MYSQL;
		case postgresql:
			return DataSourceKind.POSTGRESQL;
		case sqlite:
			return DataSourceKind.SQLITE;
		case sqlserver:
			return DataSourceKind.SQLSERVER;
		case mongodb:
			return DataSourceKind.MONGODB;
		case prisma:
			return DataSourceKind.PRISMA;
		default:
			throw new Error(`databaseSchemaToKind not implemented for: ${schema}`);
	}
};

const applyNameSpaceToSingleTypeFields = (typeFields: SingleTypeField[], namespace?: string): SingleTypeField[] => {
	if (!namespace) {
		return typeFields;
	}
	return typeFields.map((typeField) => ({
		...typeField,
		typeName: `${namespace}_${typeField.typeName}`,
	}));
};

const applyNameSpaceToTypeNames = (typeNames: string[], namespace?: string): string[] => {
	if (!namespace) {
		return typeNames;
	}
	return typeNames.map((typeName) => {
		return `${namespace}_${typeName}`;
	});
};

type databaseConstructor<T> = (
	schema: string,
	namespace: string,
	dataSources: DataSource<DatabaseApiCustom>[],
	fields: FieldConfiguration[],
	types: TypeConfiguration[],
	interpolateVariableDefinitionAsJSON: string[],
	customJsonScalars?: string[] | undefined
) => T;

type DbApi = Api<DatabaseApiCustom>;

function introspectDatabaseWithCache<TApi extends Api<ApiType>>(
	ctor: databaseConstructor<TApi>,
	databaseUrlSchema: DatabaseSchema
) {
	const generator = async (introspection: DatabaseIntrospection, _: ApiIntrospectionOptions) => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			databaseUrlSchema,
			5
		);
		return ctor(
			schema,
			introspection.apiNamespace || '',
			dataSources,
			fields,
			types,
			interpolateVariableDefinitionAsJSON
		);
	};

	return async (introspection: DatabaseIntrospection) => {
		const url = resolveVariable(introspection.databaseURL);
		const hash = await urlHash(url);
		// Introspecting a database might be expensive, even if it's a local network URL.
		// Consider all sources as remote to cache them more aggressively
		const cacheConfig = { keyInput: hash };
		return introspectWithCache(introspection, cacheConfig, generator);
	};
}

export const introspectPostgresql = introspectDatabaseWithCache(
	(
		schema: string,
		namespace: string,
		dataSources: DataSource<DatabaseApiCustom>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[] | undefined
	) =>
		new PostgresqlApi(
			schema,
			namespace,
			dataSources,
			fields,
			types,
			interpolateVariableDefinitionAsJSON,
			customJsonScalars
		),
	postgresql
);
export const introspectMySQL = introspectDatabaseWithCache(
	(
		schema: string,
		namespace: string,
		dataSources: DataSource<DatabaseApiCustom>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[] | undefined
	) =>
		new MySQLApi(schema, namespace, dataSources, fields, types, interpolateVariableDefinitionAsJSON, customJsonScalars),
	mysql
);
export const introspectPlanetScale = introspectDatabaseWithCache(
	(
		schema: string,
		namespace: string,
		dataSources: DataSource<DatabaseApiCustom>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[] | undefined
	) =>
		new PlanetscaleApi(
			schema,
			namespace,
			dataSources,
			fields,
			types,
			interpolateVariableDefinitionAsJSON,
			customJsonScalars
		),
	planetscale
);
export const introspectSQLite = introspectDatabaseWithCache(
	(
		schema: string,
		namespace: string,
		dataSources: DataSource<DatabaseApiCustom>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[] | undefined
	) =>
		new SQLiteApi(
			schema,
			namespace,
			dataSources,
			fields,
			types,
			interpolateVariableDefinitionAsJSON,
			customJsonScalars
		),
	sqlite
);
export const introspectSQLServer = introspectDatabaseWithCache(
	(
		schema: string,
		namespace: string,
		dataSources: DataSource<DatabaseApiCustom>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[] | undefined
	) =>
		new SQLServerApi(
			schema,
			namespace,
			dataSources,
			fields,
			types,
			interpolateVariableDefinitionAsJSON,
			customJsonScalars
		),
	sqlserver
);
export const introspectMongoDB = introspectDatabaseWithCache(
	(
		schema: string,
		namespace: string,
		dataSources: DataSource<DatabaseApiCustom>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[] | undefined
	) =>
		new MongoDBApi(
			schema,
			namespace,
			dataSources,
			fields,
			types,
			interpolateVariableDefinitionAsJSON,
			customJsonScalars
		),
	mongodb
);

export const introspectPrisma = async (introspection: PrismaIntrospection) => {
	const cacheConfig: IntrospectionCacheConfiguration = {
		keyInput: await fileHash(introspection.prismaFilePath),
		dataSource: 'localFilesystem',
	};
	return introspectWithCache(
		introspection,
		cacheConfig,
		async (introspection: PrismaIntrospection, _: ApiIntrospectionOptions): Promise<PrismaApi> => {
			const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
				{ ...introspection, databaseURL: introspection.prismaFilePath },
				prisma,
				5
			);
			return new PrismaApi(
				schema,
				introspection.apiNamespace || '',
				dataSources,
				fields,
				types,
				interpolateVariableDefinitionAsJSON
			);
		}
	);
};
