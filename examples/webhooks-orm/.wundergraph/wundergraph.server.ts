import {
	configureWunderGraphServer,
	CreateWebhookVerifier,
	EnvironmentVariable,
	GithubWebhookVerifier,
	WebhookVerifierKind,
} from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	webhooks: {
		// Enable this if you configure this endpoint on Github.
		// Don't forget to set the environment variable before starting your WunderNode
		// github: {
		// 	verifier: GithubWebhookVerifier(new EnvironmentVariable('GITHUB_SECRET')),
		// },
		// or generic
		// github: {
		// 	verifier: CreateWebhookVerifier({
		// 		kind: WebhookVerifierKind.HMAC_SHA256,
		// 		signatureHeaderPrefix: '',
		// 		secret: new EnvironmentVariable('YOUR_SECRET'),
		// 		signatureHeader: '',
		// 	}),
		// },
	},
}));
