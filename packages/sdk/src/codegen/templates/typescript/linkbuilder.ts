import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { queryTypeFields, typesInfo } from '../../../linkbuilder';
import { buildSchema } from 'graphql';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { template } from './linkbuilder.template';

export class TypeScriptLinkBuilder implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const schema = buildSchema(generationConfig.config.application.EngineConfiguration.Schema);
		const fields = queryTypeFields(schema);
		const types = typesInfo(schema);
		const model: Model = {
			fields: fields.map((field) => ({
				name: field.fieldName,
				args: field.arguments.map((arg) => arg.name),
			})),
			types: types.map((t) => ({
				name: t.typeName,
				fields: t.fieldNames,
			})),
		};
		const content = tmpl(model);
		return Promise.resolve([
			{
				path: 'linkbuilder.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}

interface Model {
	types: {
		name: string;
		fields: string[];
	}[];
	fields: {
		name: string;
		args: string[];
	}[];
}
