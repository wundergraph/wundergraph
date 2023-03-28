import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { template } from './ts-operation-errors.template';
import { uniqBy, filter } from 'lodash';
import { TypeScriptOperation } from '../../../graphql/operations';
import { OperationExecutionEngine } from '@wundergraph/protobuf';
import { stringToCamelCase } from '../../../strings';

type OpTemplateError = {
	operationName: string;
	operationPathName: string;
	code: string;
	statusCode?: number;
	message: string;
	name: string;
};

export class TypeScriptOperationErrors implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);

		const tsOperations: TypeScriptOperation[] = generationConfig.config.application.Operations.filter(
			(operation) => operation.ExecutionEngine == OperationExecutionEngine.ENGINE_NODEJS
		);

		let tsErrors: OpTemplateError[] = [];
		for (const op of tsOperations) {
			const elem = op.Errors?.map((tsErr) => {
				const e: OpTemplateError = {
					operationName: op.Name,
					operationPathName: op.PathName,
					code: tsErr.code,
					statusCode: tsErr.statusCode,
					message: tsErr.message,
					name: toCamelCaseWithCapitalized(tsErr.code),
				};
				return e;
			}).flat();
			if (elem != undefined) {
				tsErrors.push(...elem);
			}
		}

		let uniqueErrors = uniqBy(tsErrors, 'code');
		let opToErrors: { [path: string]: OpTemplateError[] } = {};
		for (const op of tsOperations) {
			opToErrors[op.Name] = filter(tsErrors, (tsErr) => tsErr?.operationPathName === op.PathName);
		}

		const content = tmpl({
			tsOperations,
			uniqueErrors,
			opToErrors,
		});
		return Promise.resolve([
			{
				path: 'ts-operation-errors.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}

function toCamelCaseWithCapitalized(str: string) {
	const name = stringToCamelCase(str);
	return name.charAt(0).toUpperCase() + name.slice(1);
}
