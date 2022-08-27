import { handlebarTemplate } from './client.template';
import Handlebars from 'handlebars';
import { Template, TemplateOutputFile } from '../../index';
import { formatTypeScript } from './';

import hash from 'object-hash';
import { ResolvedWunderGraphConfig } from '../../../configure';

export class TypeScriptClientTemplate implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(handlebarTemplate);
		const content = tmpl({
			baseURL: config.deployment.environment.baseUrl,
			roleDefinitions: config.authentication.roles.map((role) => '"' + role + '"').join(' | '),
			sdkVersion: config.sdkVersion,
			applicationPath: config.deployment.path,
			applicationHash: hash(config).substring(0, 8),
			hasAuthProviders: config.authentication.cookieBased.length !== 0,
			authProviders: config.authentication.cookieBased.map((provider) => provider.id),
			hasS3Providers: config.application.S3UploadProvider.length !== 0,
			s3Providers: config.application.S3UploadProvider.map((provider) => provider.name),
		});
		return Promise.resolve([
			{
				path: 'client.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
}
