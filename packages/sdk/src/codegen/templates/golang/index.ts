import { Template, TemplateOutputFile, visitJSONSchema } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import { hasInput } from '../typescript/react';
import { JSONSchema7 as JSONSchema, JSONSchema7 } from 'json-schema';

export class GolangInputModels implements Template {
	async generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const content = config.application.Operations.filter(hasInput)
			.map((op) => JSONSchemaToGolangStruct(op.VariablesSchema, op.Name + 'Input', false))
			.join('\n\n');
		return Promise.resolve([
			{
				path: 'models.go',
				content,
				doNotEditHeader: true,
			},
		]);
	}
}

export class GolangResponseModels implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const content = config.application.Operations.map((op) => {
			const dataName = '#/definitions/' + op.Name + 'ResponseData';
			const responseSchema = JSON.parse(JSON.stringify(op.ResponseSchema)) as JSONSchema7;
			if (responseSchema.properties) {
				responseSchema.properties['data'] = {
					$ref: dataName,
				};
			}
			return JSONSchemaToGolangStruct(responseSchema, op.Name + 'Response', true);
		}).join('\n\n');
		return Promise.resolve([
			{
				path: 'models.go',
				content,
				doNotEditHeader: true,
			},
		]);
	}
}

export class GolangClient implements Template {
	async generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		return Promise.resolve([
			{
				path: 'client.go',
				content: '',
				doNotEditHeader: true,
			},
		]);
	}
}

const JSONSchemaToGolangStruct = (schema: JSONSchema, structName: string, withErrors: boolean): string => {
	let out = '';
	const writeType = (name: string, isRequired: boolean, typeName: string) => {
		out += `${name + (isRequired ? '' : '?')}: ${typeName}\n`;
	};
	visitJSONSchema(schema, {
		root: {
			enter: () => {
				out += `type struct ${structName} {\n`;
			},
			leave: () => {
				if (withErrors) {
					out += `errors: []GraphQLError;\n`;
				}
				out += '}';
			},
		},
		number: (name, isRequired, isArray) => {
			if (isArray) {
				out += 'float32';
			} else {
				writeType(name, isRequired, 'float32');
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
