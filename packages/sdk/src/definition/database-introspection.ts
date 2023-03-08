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
import { DataSourceKind, FieldConfiguration, SingleTypeField, TypeConfiguration } from '@wundergraph/protobuf';

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

interface databaseConstructor<T> {
	new (
		schema: string,
		dataSources: DataSource<DatabaseApiCustom>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[] | undefined
	): T;
}

function databaseIntrospector<T>(
	ctor: databaseConstructor<T>,
	databaseUrlSchema: DatabaseSchema
): (introspection: DatabaseIntrospection) => Promise<T> {
	return async (introspection: DatabaseIntrospection) => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			introspection,
			databaseUrlSchema,
			5
		);
		return new ctor(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	};
}

export const introspectPostgresql = (introspection: DatabaseIntrospection): Promise<PostgresqlApi> =>
	introspectWithCache(introspection, databaseIntrospector(PostgresqlApi, postgresql));

export const introspectMySQL = (introspection: DatabaseIntrospection): Promise<MySQLApi> =>
	introspectWithCache(introspection, databaseIntrospector(MySQLApi, mysql));

export const introspectPlanetScale = async (introspection: DatabaseIntrospection): Promise<PlanetscaleApi> =>
	introspectWithCache(introspection, databaseIntrospector(PlanetscaleApi, planetscale));

export const introspectSQLite = async (introspection: DatabaseIntrospection): Promise<SQLiteApi> =>
	introspectWithCache(introspection, databaseIntrospector(SQLiteApi, sqlite));

export const introspectSQLServer = async (introspection: DatabaseIntrospection): Promise<SQLServerApi> =>
	introspectWithCache(introspection, databaseIntrospector(SQLServerApi, sqlserver));

export const introspectMongoDB = async (introspection: DatabaseIntrospection): Promise<MongoDBApi> =>
	introspectWithCache(introspection, databaseIntrospector(MongoDBApi, mongodb));

export const introspectPrisma = async (introspection: PrismaIntrospection): Promise<PrismaApi> =>
	introspectWithCache(introspection, async (introspection: PrismaIntrospection): Promise<PrismaApi> => {
		const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
			{ ...introspection, databaseURL: introspection.prismaFilePath },
			prisma,
			5
		);
		return new PrismaApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
	});
