import { handlebarTemplate } from './client.template';
import Handlebars from 'handlebars';
import { Template, TemplateOutputFile } from '../../index';
import {
	BaseTypeScriptDataModel,
	formatTypeScript,
	TypeScriptInputModels,
	TypeScriptResponseDataModels,
	TypeScriptResponseModels,
} from './';
import { OperationType } from '@wundergraph/protobuf';
import hash from 'object-hash';
import { ResolvedWunderGraphConfig } from '../../../configure';
import { listenAddrHttp } from '../../../env';
import { liveQueries, modelImports, operations, queries } from './helpers';

export class TypeScriptClient implements Template {
	constructor(reactNative: boolean = false) {}
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(handlebarTemplate);
		const _queries = queries(config.application, false);
		const _liveQueries = liveQueries(config.application, false);
		const _mutations = operations(config.application, OperationType.MUTATION, false);
		const _subscriptions = operations(config.application, OperationType.SUBSCRIPTION, false);
		const productionBaseURL = 'https://' + config.deployment.environment.name;
		const content = tmpl({
			modelImports: modelImports(config.application, false, true),
			baseURL: process.env.NODE_ENV === 'production' ? productionBaseURL : listenAddrHttp,
			roleDefinitions: config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
			sdkVersion: config.sdkVersion,
			applicationPath: config.deployment.path,
			applicationHash: hash(config).substring(0, 8),
			queries: _queries,
			liveQueries: _liveQueries,
			hasLiveQueries: _liveQueries.length !== 0,
			hasQueries: _queries.length !== 0,
			mutations: _mutations,
			hasMutations: _mutations.length !== 0,
			subscriptions: _subscriptions,
			hasSubscriptions: _subscriptions.length !== 0,
			hasSubscriptionsOrLiveQueries: _subscriptions.length + _liveQueries.length !== 0,
			hasAuthProviders: config.authentication.cookieBased.length !== 0,
			authProviders: config.authentication.cookieBased.map((provider) => provider.id),
			hasS3Providers: config.application.S3UploadProvider.length !== 0,
			s3Providers: config.application.S3UploadProvider.map((provider) => provider.name),
			hasS3Provider: config.application.S3UploadProvider.length > 0,
			s3Provider: config.application.S3UploadProvider,
		});
		return Promise.resolve([
			{
				path: 'client.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
	dependencies(): Template[] {
		return [
			new TypeScriptInputModels(),
			new TypeScriptResponseModels(),
			new TypeScriptResponseDataModels(),
			new BaseTypeScriptDataModel(),
		];
	}
}
