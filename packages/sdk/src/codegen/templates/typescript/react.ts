import { doNotEditHeader, Template, TemplateOutputFile } from '../../index';
import { CodeGenerationConfig, ResolvedApplication } from '../../../configure';
import { formatTypeScript } from './index';
import Handlebars from 'handlebars';
import { GraphQLOperation } from '../../../graphql/operations';
import { OperationType } from '@wundergraph/protobuf';
import { template as providerTemplate } from './react.provider.template';
import { template as reactNativeProviderTemplate } from './react.native.provider.template';
import { template as hooksTemplate } from './react.hooks.template';
import { hasInput, isNotInternal, queries as allQueries } from './helpers';

export class TypescriptReactProvider implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(providerTemplate);
		const allOperations = allQueries(generationConfig.config.application, false);
		const content = tmpl({
			allOperations: allOperations,
			hasAuthProviders: generationConfig.config.authentication.cookieBased.length !== 0,
		});
		return Promise.resolve([
			{
				path: 'provider.tsx',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}

export class TypescriptReactNativeProvider implements Template {
	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(reactNativeProviderTemplate);
		const allOperations = allQueries(generationConfig.config.application, false);
		const content = tmpl({
			allOperations: allOperations,
			hasAuthProviders: generationConfig.config.authentication.cookieBased.length !== 0,
		});
		return Promise.resolve([
			{
				path: 'provider.tsx',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}

export class TypescriptReactHooks implements Template {
	constructor(reactNative?: boolean) {
		this.reactNative = reactNative || false;
	}

	private readonly reactNative: boolean;

	generate(generationConfig: CodeGenerationConfig): Promise<TemplateOutputFile[]> {
		const config = generationConfig.config;
		const tmpl = Handlebars.compile(hooksTemplate);
		const _imports = imports(config.application);
		_imports.push(...queryResponseImports(config.application));
		const _queries = queries(config.application);
		const _liveQueries = liveQueries(config.application);
		const _mutations = mutations(config.application);
		const _subscriptions = subscriptions(config.application);
		const content = tmpl({
			imports: _imports,
			hasImports: _imports.length !== 0,
			queries: _queries,
			hasQueries: _queries.length !== 0,
			liveQueries: _liveQueries,
			hasLiveQueries: _liveQueries.length !== 0,
			mutations: _mutations,
			hasMutations: _mutations.length !== 0,
			subscriptions: _subscriptions,
			hasSubscriptions: _subscriptions.length !== 0,
			hasSubscriptionsOrLiveQueries: _subscriptions.length + _liveQueries.length !== 0,
			hasAuthProviders: config.authentication.cookieBased.length !== 0,
			reactNative: this.reactNative,
		});
		return Promise.resolve([
			{
				path: 'hooks.ts',
				content: formatTypeScript(content),
				header: doNotEditHeader,
			},
		]);
	}
}

const mustOperationTypeQuery = (op: GraphQLOperation) => op.OperationType === OperationType.QUERY;
const mustLiveQuery = (op: GraphQLOperation) => op.LiveQuery !== undefined && op.LiveQuery.enable;
const mustOperationTypeMutation = (op: GraphQLOperation) => op.OperationType === OperationType.MUTATION;
const mustOperationTypeSubscription = (op: GraphQLOperation) => op.OperationType === OperationType.SUBSCRIPTION;

const imports = (application: ResolvedApplication): string[] =>
	application.Operations.filter(hasInput)
		.filter(isNotInternal)
		.map((op) => op.Name + 'Input');

const queryResponseImports = (application: ResolvedApplication): string[] =>
	application.Operations.filter(isNotInternal)
		.filter((op) => op.OperationType === OperationType.QUERY)
		.map((op) => op.Name + 'Response');

interface Operation {
	name: string;
	hasInput: boolean;
}

const operation = (op: GraphQLOperation) => ({
	name: op.Name,
	hasInput: hasInput(op),
	requiresAuthentication: op.AuthenticationConfig?.required ?? false,
});

const queries = (application: ResolvedApplication): Operation[] =>
	application.Operations.filter(isNotInternal).filter(mustOperationTypeQuery).map(operation);

const subscriptions = (application: ResolvedApplication): Operation[] =>
	application.Operations.filter(isNotInternal).filter(mustOperationTypeSubscription).map(operation);

const liveQueries = (application: ResolvedApplication): Operation[] =>
	application.Operations.filter(isNotInternal).filter(mustOperationTypeQuery).filter(mustLiveQuery).map(operation);

const mutations = (application: ResolvedApplication): Operation[] =>
	application.Operations.filter(isNotInternal).filter(mustOperationTypeMutation).map(operation);
