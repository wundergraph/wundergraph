//language=handlebars
export const template = `
import type { WebhookConfiguration } from '@wundergraph/sdk';

export type WebhooksConfig = {
{{#each webhooks}}
		{{name}}?: WebhookConfiguration;
{{/each}}
}
`;
