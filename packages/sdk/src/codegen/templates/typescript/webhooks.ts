import { Template, TemplateOutputFile } from '../../index';
import { ResolvedWunderGraphConfig } from '../../../configure';
import Handlebars from 'handlebars';
import { formatTypeScript } from './index';
import { template } from './webhooks.template';

export class WunderGraphWebhooksPlugin implements Template {
	generate(config: ResolvedWunderGraphConfig): Promise<TemplateOutputFile[]> {
		const tmpl = Handlebars.compile(template);
		const content = tmpl({
			webhooks: config.webhooks,
		});
		return Promise.resolve([
			{
				path: 'wundergraph.webhooks.ts',
				content: formatTypeScript(content),
				doNotEditHeader: true,
			},
		]);
	}
}
