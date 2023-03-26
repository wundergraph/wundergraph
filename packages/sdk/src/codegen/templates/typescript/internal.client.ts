import Handlebars from 'handlebars';
import { OperationType } from '@wundergraph/protobuf';
import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig } from '../../../configure';
import { formatTypeScript } from './index';
import { modelImports, operations } from './helpers';
import { template } from './internal.client.template';
import templates from '../index';

export class WunderGraphInternalApiClient implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const config = generationConfig.config;
		const tmpl = Handlebars.compile(template);
		const _queries = operations(config.application, OperationType.QUERY, false);
		const _internalQueries = operations(config.application, OperationType.QUERY, true);
		const _mutations = operations(config.application, OperationType.MUTATION, false);
		const _internalMutations = operations(config.application, OperationType.MUTATION, true);

		const content = tmpl({
			modelImports: modelImports(config.application, true, true),
			queries: _queries,
			hasQueries: _queries.length !== 0,
			mutations: _mutations,
			hasMutations: _mutations.length !== 0,
			internalQueries: _internalQueries,
			hasInternalQueries: _internalQueries.length !== 0,
			internalMutations: _internalMutations,
			hasInternalMutations: _internalMutations.length !== 0,
		});
		return Promise.resolve([
			{
				path: 'wundergraph.internal.client.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}

	dependencies(): Template[] {
		return templates.typescript.models;
	}
}
