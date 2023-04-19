//language=handlebars
export const template = `
import type { WebhookConfiguration } from '@wundergraph/sdk/server';
import type { InternalClient } from "./wundergraph.internal.client";
import type { InternalOperationsClient } from "./wundergraph.internal.operations.client";
import { createWebhookFactory } from "@wundergraph/sdk/server";

export type WebhooksConfig = {
{{#each webhooks}}
	'{{name}}'?: WebhookConfiguration;
{{/each}}
}

export const createWebhook = createWebhookFactory<InternalOperationsClient, InternalClient>();
`;
