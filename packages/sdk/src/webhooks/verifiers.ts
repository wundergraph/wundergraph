import { webhookVerifierKindFromJSON } from '@wundergraph/protobuf';
import { EnvironmentVariable } from '../configure';

export enum WebhookVerifierKind {
	HMAC_SHA256 = 0,
}

export interface WebhookVerifier {
	kind: WebhookVerifierKind;
	secret: EnvironmentVariable;
	signatureHeader: string;
	signatureHeaderPrefix: string;
}

export const CreateWebhookVerifier = (
	kind: typeof WebhookVerifierKind,
	signatureHeader: string,
	signatureHeaderPrefix: string,
	secret: EnvironmentVariable
): WebhookVerifier => {
	return {
		kind: webhookVerifierKindFromJSON(kind),
		signatureHeader,
		signatureHeaderPrefix,
		secret,
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
