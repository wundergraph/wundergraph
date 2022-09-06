import { doNotEditHeader, Template, TemplateOutputFile, visitJSONSchema } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import prettier from 'prettier';
import { JSONSchema7, JSONSchema7 as JSONSchema } from 'json-schema';
import { hasInput, hasInternalInput, hasInjectedInput } from './react';
import fs from 'fs';
import path from 'path';

export const formatTypeScript = (input: string): string => {
	return prettier.format(input, {
		parser: 'typescript',
		printWidth: 120,
		useTabs: true,
		tabWidth: 2,
	});
};

export class TypeScriptInputModels implements Template {
	async generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const content = config.application.Operations.filter(hasInput)
			.map((op) => JSONSchemaToTypescriptInterface(op.VariablesSchema, op.Name + 'Input', false))
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
	async generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const content = config.application.Operations.filter(hasInternalInput)
			.map((op) => JSONSchemaToTypescriptInterface(op.InternalVariablesSchema, 'Internal' + op.Name + 'Input', false))
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
	async generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const content = config.application.Operations.filter(hasInjectedInput)
			.map((op) => JSONSchemaToTypescriptInterface(op.InjectedVariablesSchema, 'Injected' + op.Name + 'Input', false))
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

export class TypeScriptResponseModels implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const content = config.application.Operations.map((op) => {
			const dataName = '#/definitions/' + op.Name + 'ResponseData';
			const responseSchema = JSON.parse(JSON.stringify(op.ResponseSchema)) as JSONSchema7;
			if (responseSchema.properties) {
				responseSchema.properties['data'] = {
					$ref: dataName,
				};
			}
			return JSONSchemaToTypescriptInterface(responseSchema, op.Name + 'Response', true);
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

export class TypeScriptResponseDataModels implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const content = config.application.Operations.filter(
			(op) => op.ResponseSchema.properties !== undefined && op.ResponseSchema.properties['data'] !== undefined
		)
			.map((op) =>
				JSONSchemaToTypescriptInterface(
					op.ResponseSchema.properties!['data'] as JSONSchema7,
					op.Name + 'ResponseData',
					false
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

export class BaseTypeScriptDataModel implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const definitions: Map<string, JSONSchema7> = new Map();

		config.application.Operations.forEach((op) => {
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

		const content = Array.from(definitions.entries())
			.map(([definitionName, definition]) => JSONSchemaToTypescriptInterface(definition, definitionName, false))
			.join('\n\n');

		return Promise.resolve([
			{
				path: 'models.ts',
				content: formatTypeScript('\n' + content + '\n\n' + typeScriptJsonDefinition + '\n' + graphQLErrorDefinition),
				header: doNotEditHeader,
			},
		]);
	}
}

const typeScriptJsonDefinition = `
export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };`;

const graphQLErrorDefinition = `
export interface GraphQLError {
    message: string;
    path?: ReadonlyArray<string | number>;
}
`;

const JSONSchemaToTypescriptInterface = (schema: JSONSchema, interfaceName: string, withErrors: boolean): string => {
	let out = '';
	const writeType = (name: string, isRequired: boolean, typeName: string) => {
		out += `${name + (isRequired ? '' : '?')}: ${typeName}\n`;
	};
	visitJSONSchema(schema, {
		root: {
			enter: () => {
				out += `export interface ${interfaceName} {\n`;
			},
			leave: () => {
				if (withErrors) {
					out += `errors?: ReadonlyArray<GraphQLError>;\n`;
				}
				out += '}';
			},
		},
		number: (name, isRequired, isArray) => {
			if (isArray) {
				out += 'number';
			} else {
				writeType(name, isRequired, 'number');
			}
		},
		array: {
			enter: (name, isRequired, isArray) => {
				out += `${name + (isRequired ? '' : '?')}: `;
			},
			leave: (name, isRequired, isArray) => {
				out += '[],';
			},
		},
		string: (name, isRequired, isArray, enumValues) => {
			if (enumValues !== undefined) {
				const values = enumValues.map((v) => `"${v}"`).join(' | ');
				if (isArray) {
					out += ' (' + values + ') ';
				} else {
					writeType(name, isRequired, values);
				}
				return;
			}
			if (isArray) {
				out += 'string';
			} else {
				writeType(name, isRequired, 'string');
			}
		},
		object: {
			enter: (name, isRequired, isArray) => {
				if (isArray) {
					out += '{\n';
				} else {
					writeType(name, isRequired, '{');
				}
			},
			leave: (name, isRequired, isArray) => {
				out += '}';
				if (!isArray) {
					out += ',\n';
				}
			},
		},
		boolean: (name, isRequired, isArray) => {
			if (isArray) {
				out += 'boolean';
			} else {
				writeType(name, isRequired, 'boolean');
			}
		},
		any: (name, isRequired, isArray) => {
			if (isArray) {
				out += 'JSONValue';
			} else {
				writeType(name, isRequired, 'JSONValue');
			}
		},
		customType: (name, typeName, isRequired, isArray) => {
			if (isArray) {
				out += typeName;
			} else {
				writeType(name, isRequired, typeName);
			}
		},
	});
	return out;
};

export const loadFile = (file: string | (() => string)): string => {
	if (typeof file === 'function') {
		return file();
	}
	if (typeof file !== 'string') {
		return '';
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
