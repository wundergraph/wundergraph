import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import prettier from 'prettier';
import { JSONSchema7, JSONSchema7 as JSONSchema, JSONSchema7Type } from 'json-schema';
import {
	hasInjectedInput,
	hasInput,
	hasInternalInput,
	operationInjectedInputTypename,
	operationInputTypename,
	operationInternalInputTypename,
	operationResponseDataTypename,
	operationResponseTypename,
} from './helpers';
import fs from 'fs';
import path from 'path';
import { visitJSONSchema } from '../../jsonschema';
import { OperationExecutionEngine } from '@wundergraph/protobuf';
import { GraphQLOperation } from '../../../graphql/operations';
import { TypeScriptOperationErrors } from './ts-operation-errors';

declare module 'json-schema' {
	export interface JSONSchema7 {
		'x-graphql-enum-name'?: string;
	}
}

export const formatTypeScript = (input: string): string => {
	return prettier.format(input, {
		parser: 'typescript',
		printWidth: 120,
		useTabs: true,
		tabWidth: 2,
	});
};

export class TypeScriptInputModels implements Template {
	async generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const content = generationConfig.config.application.Operations.filter(hasInput)
			.map((op) =>
				JSONSchemaToTypescriptInterface(
					op.VariablesSchema,
					operationInputTypename(op),
					false,
					op.ExecutionEngine === OperationExecutionEngine.ENGINE_NODEJS ? { pathName: op.PathName } : undefined,
					op.TypeScriptOperationImport
						? {
								importName: op.TypeScriptOperationImport,
								extract: 'Input',
						  }
						: undefined
				)
			)
			.join('\n\n');
		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [new BaseTypeScriptDataModel()];
	}
}

export class TypeScriptInternalInputModels implements Template {
	async generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const content = generationConfig.config.application.Operations.filter(hasInternalInput)
			.map((op) =>
				JSONSchemaToTypescriptInterface(
					op.InternalVariablesSchema,
					operationInternalInputTypename(op),
					false,
					op.ExecutionEngine === OperationExecutionEngine.ENGINE_NODEJS ? { pathName: op.PathName } : undefined
				)
			)
			.join('\n\n');
		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [new BaseTypeScriptDataModel()];
	}
}

export class TypeScriptInjectedInputModels implements Template {
	async generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const content = generationConfig.config.application.Operations.filter(hasInjectedInput)
			.map((op) =>
				JSONSchemaToTypescriptInterface(
					op.InjectedVariablesSchema,
					operationInjectedInputTypename(op),
					false,
					op.ExecutionEngine === OperationExecutionEngine.ENGINE_NODEJS ? { pathName: op.PathName } : undefined
				)
			)
			.join('\n\n');

		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [new BaseTypeScriptDataModel()];
	}
}

const responseSchema = (op: GraphQLOperation) => {
	switch (op.ExecutionEngine) {
		case OperationExecutionEngine.ENGINE_NODEJS:
			// TypeScript response models are not generated from their response schema,
			// instead they're derived from their function declaration. Generate a fake
			// top level object with a data property.
			return {
				type: 'object',
				properties: {
					data: {},
				},
			} as JSONSchema;
		case OperationExecutionEngine.ENGINE_GRAPHQL:
			return op.ResponseSchema;
	}
	throw new Error(`unhandled operation engine ${op.ExecutionEngine}`);
};

export class TypeScriptResponseModels implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const content = generationConfig.config.application.Operations.map((op) => {
			const dataName = '#/definitions/' + operationResponseDataTypename(op);
			// Cloning here is expensive. Instead, save what was where before
			// overwriting and then restore it
			const schema = responseSchema(op);
			let schemaPropertiesData: any | undefined;
			if (schema.properties) {
				// Save a copy first
				schemaPropertiesData = schema.properties['data'];
				schema.properties['data'] = {
					$ref: dataName,
				};
			}
			const jsonSchema = JSONSchemaToTypescriptInterface(
				schema,
				operationResponseTypename(op),
				true,
				op.ExecutionEngine === OperationExecutionEngine.ENGINE_NODEJS ? { pathName: op.PathName } : undefined
			);
			if (schema.properties) {
				// Restore schema.properties['data']
				schema.properties['data'] = schemaPropertiesData;
			}
			return jsonSchema;
		}).join('\n\n');
		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [new BaseTypeScriptDataModel()];
	}
}

const responseDataSchema = (op: GraphQLOperation) => {
	switch (op.ExecutionEngine) {
		case OperationExecutionEngine.ENGINE_NODEJS:
			return op.ResponseSchema;
		case OperationExecutionEngine.ENGINE_GRAPHQL:
			return op.ResponseSchema?.properties?.['data'] as JSONSchema7;
	}
	throw new Error(`unhandled operation engine ${op.ExecutionEngine}`);
};

export class TypeScriptResponseDataModels implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const content = generationConfig.config.application.Operations.map((op) =>
			JSONSchemaToTypescriptInterface(
				responseDataSchema(op),
				operationResponseDataTypename(op),
				false,
				op.ExecutionEngine === OperationExecutionEngine.ENGINE_NODEJS ? { pathName: op.PathName } : undefined,
				op.TypeScriptOperationImport
					? {
							importName: op.TypeScriptOperationImport,
							extract: 'Response',
					  }
					: undefined
			)
		).join('\n\n');
		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [new BaseTypeScriptDataModel()];
	}
}

export class TypeScriptEnumModels implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		let enumMap: Map<string, Array<JSONSchema7Type>> = new Map();

		generationConfig.config.application.Operations.forEach((op, index) => {
			const schemas: JSONSchema[] = [
				op.VariablesSchema,
				op.InjectedVariablesSchema,
				op.InternalVariablesSchema,
				op.ResponseSchema,
				op.InterpolationVariablesSchema,
			];

			for (const index in schemas) {
				enumMap = extractEnums(schemas[index], enumMap);
			}
		});

		const content = Array.from(enumMap.entries())
			.map(([name, values]) => {
				return `export const ${name} = {\n  ${values
					.map((value) => `${value}: '${value}'`)
					.join(',\n  ')}\n} as const;\n\nexport type ${name}Values = typeof ${name}[keyof typeof ${name}];\n`;
			})
			.join('\n\n');

		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [new BaseTypeScriptDataModel()];
	}
}

export class BaseTypeScriptDataModel implements Template {
	precedence = 10;
	usesOutputPath = true;

	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const definitions: Map<string, JSONSchema7> = new Map();

		generationConfig.config.application.Operations.forEach((op) => {
			if (op.VariablesSchema.definitions)
				Object.keys(op.VariablesSchema.definitions).forEach((definitionName) => {
					if (definitions.has(definitionName)) {
						return;
					}
					let definition = op.VariablesSchema.definitions![definitionName];
					if (typeof definition !== 'object') {
						return;
					}
					definitions.set(definitionName, definition);
				});
			if (op.InjectedVariablesSchema.definitions)
				Object.keys(op.InjectedVariablesSchema.definitions).forEach((definitionName) => {
					if (definitions.has(definitionName)) {
						return;
					}
					let definition = op.InjectedVariablesSchema.definitions![definitionName];
					if (typeof definition !== 'object') {
						return;
					}
					definitions.set(definitionName, definition);
				});
			if (op.InternalVariablesSchema.definitions)
				Object.keys(op.InternalVariablesSchema.definitions).forEach((definitionName) => {
					if (definitions.has(definitionName)) {
						return;
					}
					let definition = op.InternalVariablesSchema.definitions![definitionName];
					if (typeof definition !== 'object') {
						return;
					}
					definitions.set(definitionName, definition);
				});
		});

		const models = Array.from(definitions.entries())
			.map(([definitionName, definition]) => JSONSchemaToTypescriptInterface(definition, definitionName, false))
			.join('\n\n');

		const functionImports = typescriptFunctionsImports(generationConfig);
		const graphQLTypeImport = "import type { GraphQLError } from '@wundergraph/sdk/client';";
		const imports = functionImports + graphQLTypeImport;

		const content = '\n' + imports + '\n\n' + models + '\n\n' + typeScriptJsonDefinition + '\n';

		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return [new TypeScriptOperationErrors()];
	}
}

const typeScriptJsonDefinition = `
export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };`;

const typescriptFunctionsImports = (generationConfig: CodeGenerationConfig): string => {
	const ops = generationConfig.config.application.Operations.filter(
		(op) => op.ExecutionEngine === OperationExecutionEngine.ENGINE_NODEJS
	);
	if (ops.length === 0) {
		return '';
	}
	const relBasePath = path.relative(generationConfig.outPath, generationConfig.wunderGraphDir);
	// Be careful with translating filesystem paths to import paths on Windows
	const relImport = (op: GraphQLOperation) => path.join(relBasePath, 'operations', op.PathName).replace(/\\/g, '/');
	return (
		ops.map((op) => `import type function_${op.Name} from '${relImport(op)}';\n`).join('') +
		'import type {ExtractInput,ExtractResponse} from "@wundergraph/sdk/operations";\n' +
		'import type { OperationErrors } from "./ts-operation-errors";\n'
	);
};

interface typeScriptOperationImport {
	importName: string;
	extract: 'Input' | 'Response';
}

interface typeScriptOperation {
	pathName: string;
}

const getTypeScriptOperationTypeExports = (
	interfaceName: string,
	typeScriptOperationImport: typeScriptOperationImport
): string => {
	switch (typeScriptOperationImport.extract) {
		case 'Input':
			return `export type ${interfaceName} = ExtractInput<typeof ${typeScriptOperationImport.importName}>;`;
		case 'Response':
			return `export type ${interfaceName} = ExtractResponse<typeof ${typeScriptOperationImport.importName}>;`;
	}
	return '';
};

const JSONSchemaToTypescriptInterface = (
	schema: JSONSchema,
	interfaceName: string,
	withErrors: boolean,
	typeScriptOperation?: typeScriptOperation,
	typeScriptOperationImport?: typeScriptOperationImport
): string => {
	if (typeScriptOperationImport) {
		const exportType = getTypeScriptOperationTypeExports(interfaceName, typeScriptOperationImport);
		if (exportType) {
			return exportType;
		}
	}

	if (typeof schema === 'object' && !schema.type && !schema.properties && !schema.$ref) {
		return `export type ${interfaceName} = JSONObject;`;
	}

	const isUnion = !!schema.oneOf;

	const out: string[] = [];
	const writeType = (name: string, isRequired: boolean, typeName: string) => {
		out.push(`${name + (isRequired ? '' : '?')}: ${typeName}\n`);
	};
	const writeEnumType = (enumName: string) => {
		out.push(`${enumName}Values`);
	};
	visitJSONSchema(schema, {
		root: {
			enter: () => {
				if (isUnion) {
					out.push(`export type ${interfaceName} = `);
					return;
				}

				out.push(`export interface ${interfaceName} {\n`);
			},
			leave: () => {
				if (withErrors) {
					// TODO: Differentiate between ts errors and graphql errors for the base models
					//  as soon as we have a common abstraction for errors
					if (typeScriptOperation) {
						out.push(`errors?: GraphQLError[];\n`);
					} else {
						out.push(`errors?: GraphQLError[];\n`);
					}
				}
				if (!isUnion) {
					out.push('}');
				}
			},
		},
		number: (name, isRequired, isArray) => {
			if (isArray) {
				out.push('number');
			} else {
				writeType(name, isRequired, 'number');
			}
		},
		array: {
			enter: (name, isRequired, isArray) => {
				if (name === '') return;
				out.push(`${name + (isRequired ? '' : '?')}: `);
			},
			leave: (name, isRequired, isArray) => {
				out.push(name === '' ? '[]' : '[],');
			},
		},
		string: (name, isRequired, isArray, enumValues, enumName) => {
			if (enumValues !== undefined) {
				const values = enumValues.map((v) => `"${v}"`).join(' | ');

				if (enumName && name) {
					writeType(name, isRequired, enumName + 'Values');
					return;
				} else if (enumName) {
					writeEnumType(enumName);
					return;
				}

				if (isArray) {
					out.push(' (' + values + ') ');
				} else {
					writeType(name, isRequired, values);
				}
				return;
			}
			if (isArray) {
				out.push('string');
			} else {
				writeType(name, isRequired, 'string');
			}
		},
		object: {
			enter: (name, isRequired, isArray) => {
				if (isArray || isUnion) {
					out.push('{\n');
				} else {
					writeType(name, isRequired, '{');
				}
			},
			leave: (name, isRequired, isArray) => {
				out.push('}');
				if (!isArray && !isUnion) {
					out.push(',\n');
				}
			},
		},
		boolean: (name, isRequired, isArray) => {
			if (isArray) {
				out.push('boolean');
			} else {
				writeType(name, isRequired, 'boolean');
			}
		},
		any: (name, typename, isRequired, isArray) => {
			typename = typename || 'JSONValue';
			if (isArray) {
				out.push(typename);
			} else {
				writeType(name, isRequired, typename);
			}
		},
		customType: (name, typeName, isRequired, isArray) => {
			if (isArray) {
				out.push(typeName);
			} else {
				writeType(name, isRequired, typeName);
			}
		},
		oneOf: {
			afterEach: (index, count) => {
				if (index !== count - 1) {
					out.push(' | ');
				}
			},
		},
	});
	return out.join('');
};

export const loadFile = (file: string | (() => string)): string => {
	if (typeof file === 'function') {
		return file();
	}
	try {
		if (path.basename(file) === file) {
			// doesn't contain path separators, not a file path
			return file;
		}
		return fs.readFileSync(path.resolve(__dirname, file)).toString();
	} catch (e) {
		return file as string;
	}
};

export const extractEnums = (schema: JSONSchema, enumMap: Map<string, Array<JSONSchema7Type>>): Map<string, any> => {
	const visitedRefs: string[] = [];

	const traverseSchema = (obj: JSONSchema) => {
		if (obj.enum && obj['x-graphql-enum-name']) {
			const name = obj['x-graphql-enum-name'];
			if (!enumMap.get(name)) {
				enumMap.set(name, obj.enum);
			}
		}

		if (obj.$ref) {
			const refName = obj.$ref.split('/').pop() as string;
			const refSchema = schema.definitions?.[refName];
			if (refSchema && typeof refSchema !== 'boolean' && !visitedRefs.includes(refName)) {
				visitedRefs.push(refName);
				traverseSchema(refSchema);
			}
		}

		if (obj.properties) {
			for (const prop in obj.properties) {
				const property = obj.properties[prop];
				if (typeof property !== 'boolean') {
					traverseSchema(property);
				}
			}
		}

		if (obj.oneOf) {
			for (const item of obj.oneOf) {
				if (typeof item !== 'boolean') {
					traverseSchema(item);
				}
			}
		}

		if (obj.items && typeof obj.items !== 'boolean' && !Array.isArray(obj.items)) {
			traverseSchema(obj.items);
		}
	};

	traverseSchema(schema);

	return enumMap;
};
