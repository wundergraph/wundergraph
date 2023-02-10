import { introspectWithCache } from './introspection-cache';
import { DatabaseSchema, mongodb, mysql, planetscale, postgresql, prisma, sqlite, sqlserver } from '../db/types';
import {
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
import { mapInputVariable } from '../configure/variables';
import { DataSourceKind, SingleTypeField } from '@wundergraph/protobuf';

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
	const { RootNodes, ChildNodes, Fields } = configuration(schemaDocumentNode);
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

export const introspectPostgresql = async (introspection: DatabaseIntrospection): Promise<PostgresqlApi> =>
	introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<PostgresqlApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			postgresql,
			5
		);
		return new PostgresqlApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});

export const introspectMySQL = async (introspection: DatabaseIntrospection): Promise<MySQLApi> =>
	introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<MySQLApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			mysql,
			5
		);
		return new MySQLApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});

export const introspectPlanetScale = async (introspection: DatabaseIntrospection): Promise<PlanetscaleApi> =>
	introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<PlanetscaleApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			planetscale,
			5
		);
		return new PlanetscaleApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});

export const introspectSQLite = async (introspection: DatabaseIntrospection): Promise<SQLiteApi> =>
	introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<SQLiteApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			sqlite,
			5
		);
		return new SQLiteApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});

export const introspectSQLServer = async (introspection: DatabaseIntrospection): Promise<SQLServerApi> =>
	introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<SQLServerApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			sqlserver,
			5
		);
		return new SQLServerApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});

export const introspectMongoDB = async (introspection: DatabaseIntrospection): Promise<MongoDBApi> =>
	introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<MongoDBApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			mongodb,
			5
		);
		return new MongoDBApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});

export const introspectPrisma = async (introspection: PrismaIntrospection): Promise<PrismaApi> =>
	introspectWithCache(introspection, async (introspection: PrismaIntrospection): Promise<PrismaApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			{ ...introspection, databaseURL: introspection.prismaFilePath },
			prisma,
			5
		);
		return new PrismaApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});
