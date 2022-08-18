//language=handlebars
export const template = `
import { WebhookConfiguration } from '@wundergraph/sdk';

export type WebhooksConfig = {
{{#each webhooks}}
		{{name}}?: WebhookConfiguration;
{{/each}}
}
`;
