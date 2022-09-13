import Handlebars from 'handlebars';
import { OperationType } from '@wundergraph/protobuf';
import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import { formatTypeScript, TypeScriptInputModels, TypeScriptResponseModels } from './index';
import { modelImports, operations } from './web.client';
import { template } from './internal.client.template';

export class WunderGraphInternalApiClient implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const _queries = operations(config.application, OperationType.QUERY, false);
		const _internalQueries = operations(config.application, OperationType.QUERY, true);
		const _mutations = operations(config.application, OperationType.MUTATION, false);
		const _internalMutations = operations(config.application, OperationType.MUTATION, true);

		const content = tmpl({
			applicationPath: config.deployment.path,
			modelImports: modelImports(config.application, true),
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
		return [new TypeScriptInputModels(), new TypeScriptResponseModels()];
	}
}
