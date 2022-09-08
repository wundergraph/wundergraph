import { webhookVerifierKindFromJSON } from '@wundergraph/protobuf';
import { EnvironmentVariable } from '../configure/variables';

export enum WebhookVerifierKind {
	HMAC_SHA256 = 0,
}

export interface WebhookVerifier {
	kind: WebhookVerifierKind;
	secret: EnvironmentVariable;
	signatureHeader: string;
	signatureHeaderPrefix: string;
}

export interface WebhookVerifierConfiguration {
	kind: WebhookVerifierKind;
	signatureHeader: string;
	signatureHeaderPrefix: string;
	secret: EnvironmentVariable;
}

export const CreateWebhookVerifier = (config: WebhookVerifierConfiguration): WebhookVerifier => {
	return {
		kind: webhookVerifierKindFromJSON(config.kind),
		signatureHeader: config.signatureHeader,
		signatureHeaderPrefix: config.signatureHeaderPrefix,
		secret: config.secret,
	};
};

export const GithubWebhookVerifier = (secret: EnvironmentVariable): WebhookVerifier => {
	return {
		kind: webhookVerifierKindFromJSON(WebhookVerifierKind.HMAC_SHA256),
		signatureHeader: 'X-Hub-Signature-256',
		signatureHeaderPrefix: 'sha256=',
		secret,
	};
};
