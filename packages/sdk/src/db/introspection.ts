import { wunderctlExecAsync } from '../wunderctlexec';
import { FieldDefinitionNode, InputValueDefinitionNode, Kind, parse, parseType, print, TypeNode, visit } from 'graphql';
import { DatabaseIntrospection, ReplaceCustomScalarTypeFieldConfiguration } from '../definition';
import { SingleTypeField } from '@wundergraph/protobuf';
import { DMMF } from '@prisma/generator-helper';
import { NamedTypeNode } from 'graphql/language/ast';
import { startCase } from 'lodash';
import * as fs from 'fs';
import hash from 'object-hash';
import path from 'path';
import { resolveVariable } from '../configure/variables';
import { Logger } from '../logger';
import { DatabaseSchema, prisma } from './types';

export interface PrismaDatabaseIntrospectionResult {
	success: boolean;
	message: string;
	prisma_schema: string;
	graphql_schema: string;
	dmmf?: DMMF.Document;
	interpolateVariableDefinitionAsJSON: string[];
	jsonTypeFields: SingleTypeField[];
	jsonResponseFields: SingleTypeField[];
}

const _ensurePrisma = async () => {
	Logger.info('Installing prisma...');
	await wunderctlExecAsync({
		cmd: ['installPrismaDependencies'],
	});
	Logger.info('Installing prisma... done');
};

let ensurePrisma: Promise<void> | undefined;

const introspectPrismaDatabase = async (
	databaseURL: string,
	databaseSchema: DatabaseSchema
): Promise<PrismaDatabaseIntrospectionResult> => {
	if (!ensurePrisma) {
		ensurePrisma = _ensurePrisma();
	}
	await ensurePrisma;
	const id = hash({ databaseURL, databaseSchema });
	const introspectionDir = path.join('generated', 'introspection', 'database');
	if (!fs.existsSync(introspectionDir)) {
		fs.mkdirSync(introspectionDir, { recursive: true });
	}
	const introspectionFilePath = path.join('generated', 'introspection', 'database', `${id}.json`);
	const cmd = ['introspect', databaseSchema, databaseURL, `--outfile=${introspectionFilePath}`, '--debug'];
	const result = await wunderctlExecAsync({ cmd });
	if (result === undefined) {
		return {
			success: false,
			message: result,
			graphql_schema: '',
			prisma_schema: '',
			interpolateVariableDefinitionAsJSON: [],
			jsonTypeFields: [],
			jsonResponseFields: [],
		};
	}
	const output = fs.readFileSync(introspectionFilePath, 'utf8');
	const out = JSON.parse(output) as PrismaDatabaseIntrospectionResult;
	out.success = true;
	out.interpolateVariableDefinitionAsJSON = [];
	out.jsonTypeFields = [];
	out.jsonResponseFields = [];
	if (databaseSchema === prisma) {
		return out;
	}
	const dataSourceStart = out.prisma_schema.indexOf('datasource');
	const dataSourceEnd = out.prisma_schema.indexOf('}', dataSourceStart) + 1;
	out.prisma_schema = out.prisma_schema.replace(out.prisma_schema.substring(dataSourceStart, dataSourceEnd), '');
	while (out.prisma_schema.startsWith('\n')) {
		out.prisma_schema = out.prisma_schema.substring(1);
	}
	return out;
};

export const introspectPrismaDatabaseWithRetries = async (
	introspection: DatabaseIntrospection,
	databaseSchema: DatabaseSchema,
	maxRetries: number
): Promise<PrismaDatabaseIntrospectionResult> => {
	if (!introspection.databaseURL) {
		throw new Error('database URL is not defined');
	}
	const resolvedURL = resolveVariable(introspection.databaseURL);
	for (let i = 0; i < maxRetries; i++) {
		try {
			const result = await introspectPrismaDatabase(resolvedURL, databaseSchema);
			if (result.success) {
				const graphql_schema = cleanupPrismaSchema(introspection, result);
				const jsonResponseFields = findJsonResponseFields(result.graphql_schema);
				if (introspection.schemaExtension) {
					jsonResponseFields.push(...findJsonResponseFields(introspection.schemaExtension));
				}
				return {
					...result,
					graphql_schema,
					jsonResponseFields,
				};
			}
			Logger.error('database introspection failed: ' + (result.message || ''));
		} catch (e) {
			Logger.error('database introspection failed: ' + e);
		}
		Logger.info(`retrying database introspection ${i + 1}/${maxRetries}`);
	}

	const message = `introspection of ${databaseSchema} database failed after 5 attempts, make sure it's accessible at: ${introspection.databaseURL}
    Did you forget to add tables to the database? Make sure, you've run your initial migration.
    The introspection fails if there are no tables.
    Are you using a custom database schema? Make sure it's selected in the database URL.
    Please restart \"wunderctl up\" once the DB is running.
    `;

	return {
		success: false,
		message,
		prisma_schema: '',
		graphql_schema: '',
		interpolateVariableDefinitionAsJSON: [],
		jsonTypeFields: [],
		jsonResponseFields: [],
	};
};

const findJsonResponseFields = (graphql_schema: string): SingleTypeField[] => {
	const ast = parse(graphql_schema);
	const jsonResponseFields: SingleTypeField[] = [];
	let currentType: string | undefined;
	visit(ast, {
		ObjectTypeDefinition: (node) => {
			currentType = node.name.value;
		},
		FieldDefinition(node) {
			let nodeType = node.type;
			for (;;) {
				switch (nodeType.kind) {
					case 'NonNullType':
						nodeType = nodeType.type;
						continue;
					case 'ListType':
						nodeType = nodeType.type;
						continue;
					case 'NamedType':
						if (currentType && (nodeType.name.value === 'Json' || nodeType.name.value === 'JSON')) {
							jsonResponseFields.push({
								typeName: currentType,
								fieldName: node.name.value,
							});
						}
						return;
				}
			}
		},
	});
	return jsonResponseFields;
};

const floatScalars = ['Float32', 'Float64', 'Decimal'];
const intScalars = ['Int8', 'Int16', 'Int32', 'Int64', 'UInt8', 'UInt16', 'UInt32', 'UInt64', 'Long'];
const listInputFields = [
	'create',
	'createMany',
	'connect',
	'disconnect',
	'connectOrCreate',
	'upsert',
	'update',
	'updateMany',
	'delete',
];

export const cleanupPrismaSchema = (
	introspection: DatabaseIntrospection,
	result: PrismaDatabaseIntrospectionResult
): string => {
	if (introspection.schemaExtension) {
		result.graphql_schema = result.graphql_schema + ' ' + introspection.schemaExtension;
	}
	result.graphql_schema = result.graphql_schema + rowSchema;

	let insideCustomScalarType = false;
	let insideCustomScalarField = false;
	let replaceCustomScalarType: ReplaceCustomScalarTypeFieldConfiguration | undefined;
	let currentTypeName = '';
	let replaceWith = '';
	let currentInputObjectTypeName = '';

	const document = parse(result.graphql_schema);
	const cleaned = visit(document, {
		ObjectTypeDefinition: {
			enter: (node) => {
				introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
					if (node.name.value.startsWith(replace.entityName)) {
						insideCustomScalarType = true;
						currentTypeName = node.name.value;
					}
				});
				if (node.name.value === 'Mutation') {
					// we don't like the prisma schema using just JSON, so we rewrite the fields
					return {
						...node,
						fields: [
							...(node.fields || []).filter((f) => f.name.value !== 'queryRaw' && f.name.value !== 'executeRaw'),
							executeRawField(),
						],
					};
				}
				if (node.name.value === 'Query') {
					// adding raw query fields to query instead of mutation (as prisma does)
					// we're rewriting it later back to Mutation in the go engine
					return {
						...node,
						fields: [...(node.fields || []), queryRawRowField(), queryRawJsonField()],
					};
				}
			},
			leave: () => {
				insideCustomScalarType = false;
				replaceCustomScalarType = undefined;
			},
		},
		FieldDefinition: {
			enter: (node) => {
				if (insideCustomScalarType) {
					introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
						if (node.name.value.match(replace.fieldName)) {
							insideCustomScalarField = true;
							replaceCustomScalarType = replace;
							replaceWith = replace.responseTypeReplacement;
						}
					});

					if (insideCustomScalarField) {
						if (!result.jsonTypeFields.some((f) => f.typeName === currentTypeName && f.fieldName === node.name.value)) {
							result.jsonTypeFields.push({
								typeName: currentTypeName,
								fieldName: node.name.value,
							});
						}
					}
				}
			},
			leave: () => {
				insideCustomScalarField = false;
			},
		},
		InputObjectTypeDefinition: {
			enter: (node) => {
				currentInputObjectTypeName = node.name.value;
				introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
					if (node.name.value.startsWith(replace.entityName)) {
						insideCustomScalarType = true;
						currentTypeName = node.name.value;
					}
				});
			},
			leave: () => {
				insideCustomScalarType = false;
				replaceCustomScalarType = undefined;
			},
		},
		InputValueDefinition: {
			enter: (node) => {
				if (insideCustomScalarType) {
					introspection.replaceCustomScalarTypeFields?.forEach((replace) => {
						if (node.name.value.match(replace.fieldName) && replace.inputTypeReplacement) {
							insideCustomScalarField = true;
							replaceCustomScalarType = replace;
							replaceWith = replace.inputTypeReplacement;
						}
					});
				}

				if (listInputFields.includes(node.name.value)) {
					// potential list input field
					const relationship = resolveRelationship(currentInputObjectTypeName);
					if (!relationship) {
						return;
					}
					const from = result.dmmf?.datamodel.models.find((from) => from.name === relationship.from);
					if (!from) {
						return;
					}
					const to = from.fields.find((to) => to.name === relationship.to);
					if (!to) {
						return;
					}
					if (to.isList) {
						const modified: InputValueDefinitionNode = {
							...node,
							type: parseType(`[${print(node.type)}]`),
						};
						return modified;
					}
				}
			},
			leave: () => {
				insideCustomScalarField = false;
			},
		},
		NamedType: (node) => {
			if (floatScalars.includes(node.name.value)) {
				return {
					...node,
					name: {
						...node.name,
						value: 'Float',
					},
				};
			}
			if (intScalars.includes(node.name.value)) {
				return {
					...node,
					name: {
						...node.name,
						value: 'Int',
					},
				};
			}
			if (node.name.value === 'Json' || node.name.value === 'JsonNullValueInput') {
				if (result.interpolateVariableDefinitionAsJSON.indexOf(replaceWith) === -1) {
					result.interpolateVariableDefinitionAsJSON.push(replaceWith);
				}

				if (insideCustomScalarField && insideCustomScalarType && replaceCustomScalarType) {
					return {
						...node,
						name: {
							...node.name,
							value: replaceWith,
						},
					};
				}

				return {
					...node,
					name: {
						...node.name,
						value: 'JSON',
					},
				};
			}
		},
		ScalarTypeDefinition: (node) => {
			if (floatScalars.includes(node.name.value) || intScalars.includes(node.name.value)) {
				return null;
			}
			if (node.name.value === 'Json') {
				return {
					...node,
					name: {
						...node.name,
						value: 'JSON',
					},
				};
			}
		},
		EnumTypeDefinition: (node) => {
			if (node.name.value === 'JsonNullValueInput') {
				return null;
			}
		},
	});
	return print(cleaned);
};

const queryRawRowField = (): FieldDefinitionNode => ({
	kind: Kind.FIELD_DEFINITION,
	name: {
		kind: Kind.NAME,
		value: 'queryRaw',
	},
	type: {
		kind: Kind.NON_NULL_TYPE,
		type: {
			kind: Kind.LIST_TYPE,
			type: {
				kind: Kind.NON_NULL_TYPE,
				type: {
					kind: Kind.NAMED_TYPE,
					name: {
						kind: Kind.NAME,
						value: '_Row',
					},
				},
			},
		},
	},
	arguments: [
		{
			kind: Kind.INPUT_VALUE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'query',
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
		},
		{
			kind: Kind.INPUT_VALUE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'parameters',
			},
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
		},
	],
});

const queryRawJsonField = (): FieldDefinitionNode => ({
	kind: Kind.FIELD_DEFINITION,
	name: {
		kind: Kind.NAME,
		value: 'queryRawJSON',
	},
	type: {
		kind: Kind.NAMED_TYPE,
		name: {
			kind: Kind.NAME,
			value: 'JSON',
		},
	},
	arguments: [
		{
			kind: Kind.INPUT_VALUE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'query',
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
		},
		{
			kind: Kind.INPUT_VALUE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'parameters',
			},
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
		},
	],
});

const executeRawField = (): FieldDefinitionNode => ({
	kind: Kind.FIELD_DEFINITION,
	name: {
		kind: Kind.NAME,
		value: 'executeRaw',
	},
	type: {
		kind: Kind.NON_NULL_TYPE,
		type: {
			kind: Kind.NAMED_TYPE,
			name: {
				kind: Kind.NAME,
				value: 'Int',
			},
		},
	},
	arguments: [
		{
			kind: Kind.INPUT_VALUE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'query',
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
		},
		{
			kind: Kind.INPUT_VALUE_DEFINITION,
			name: {
				kind: Kind.NAME,
				value: 'parameters',
			},
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
		},
	],
});

const rowSchema = `

type _Row {
	ID: ID!
	Int: Int!
	Float: Float!
	String: String!
	Boolean: Boolean!
	DateTime: DateTime!
	JSON: JSON!
	Object: _Row!
	Array: [_Row!]!
	OptionalID: ID
	OptionalInt: Int
	OptionalFloat: Float
	OptionalString: String
	OptionalBoolean: Boolean
	OptionalDateTime: DateTime
	OptionalJSON: JSON
	OptionalObject: _Row
	OptionalArray: [_Row!]
}

`;

const unwrapNamedType = (node: TypeNode): NamedTypeNode => {
	if (node.kind === 'NamedType') {
		return node;
	}
	if (node.kind === 'NonNullType') {
		return unwrapNamedType(node.type);
	}
	if (node.kind === 'ListType') {
		return unwrapNamedType(node.type);
	}
	throw new Error(`unexpected type node: ${print(node)}`);
};

interface Relationship {
	from: string;
	to: string;
}

const resolveRelationship = (connectionType: string): Relationship | undefined => {
	connectionType = connectionType.replace('CreateMany', '');
	connectionType = connectionType.replace('CreateOrConnectWithout', '');
	connectionType = connectionType.replace('CreateOrConnect', '');
	connectionType = connectionType.replace('CreateWithout', '');
	connectionType = connectionType.replace('UpdateWithout', '');
	connectionType = connectionType.replace('UpdateWithWhereUniqueWithout', '');
	connectionType = connectionType.replace('UpsertWithout', '');
	connectionType = connectionType.replace('UpsertWithWhereUniqueWithout', '');
	connectionType = connectionType.replace('UpdateManyWithWhereWithout', '');
	connectionType = connectionType.replace('CreateNestedOneWithout', '');
	connectionType = connectionType.replace('CreateNestedManyWithout', '');
	connectionType = connectionType.replace('UpdateOneRequiredWithout', '');
	connectionType = connectionType.replace('UpdateManyWithout', '');
	connectionType = connectionType.replace('UpdateOneWithout', '');
	connectionType = connectionType.replace('UpdateMany', '');
	if (connectionType.endsWith('InputEnvelope')) {
		connectionType = connectionType.substring(0, connectionType.length - 'InputEnvelope'.length);
	}
	if (connectionType.endsWith('Input')) {
		connectionType = connectionType.substring(0, connectionType.length - 'Input'.length);
	}
	if (connectionType.endsWith('WhereUnique')) {
		connectionType = connectionType.substring(0, connectionType.length - 'WhereUnique'.length);
	}
	const fromTo = startCase(connectionType).split(' ');
	if (fromTo.length === 1) {
		return undefined;
	}
	if (fromTo.length !== 2) {
		return undefined;
	}
	return {
		from: fromTo[1].toLowerCase(),
		to: fromTo[0].toLowerCase(),
	};
};
