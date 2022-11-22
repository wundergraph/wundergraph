import {
	TypeScriptInjectedInputModels,
	TypeScriptInputModels,
	TypeScriptInternalInputModels,
	TypeScriptResponseDataModels,
	TypeScriptResponseModels,
} from './typescript';
import { TypescriptReactHooks, TypescriptReactNativeProvider, TypescriptReactProvider } from './typescript/react';
import { Operations } from './typescript/operations';
import { TypeScriptLinkBuilder } from './typescript/linkbuilder';
import { JsonSchema } from './typescript/jsonschema';
import { Forms } from './typescript/forms';
import { WunderGraphServer } from './typescript/server';
import { WunderGraphHooksPlugin } from './typescript/hooks';
import { AuthenticationProviderConfiguration } from './markdown/authentication';
import { WunderGraphWebhooksPlugin } from './typescript/webhooks';
import { TypeScriptClient } from './typescript/client';
import { TypeScriptLegacyWebClient } from './typescript/web.client';

const typescriptModels = [
	new TypeScriptInputModels(),
	new TypeScriptInternalInputModels(),
	new TypeScriptInjectedInputModels(),
	new TypeScriptResponseModels(),
	new TypeScriptResponseDataModels(),
];

const typescriptAll = [
	...typescriptModels,
	new WunderGraphServer(),
	new WunderGraphHooksPlugin(),
	new WunderGraphWebhooksPlugin(),
	new Operations(),
	new JsonSchema(),
	new TypeScriptClient(),
	new TypeScriptLinkBuilder(),
];

const templates = {
	typescript: {
		// models generates all models for input and output
		models: typescriptModels,
		inputModels: new TypeScriptInputModels(),
		responseModels: new TypeScriptResponseModels(),
		client: new TypeScriptClient(),
		all: [...typescriptAll, new AuthenticationProviderConfiguration()],
		fastifyServer: new WunderGraphServer(),
		fastifyHooksPlugin: new WunderGraphHooksPlugin(),
		fastifyWebhookPlugin: new WunderGraphWebhooksPlugin(),
		react: [
			...typescriptAll,
			new TypeScriptClient(),
			new TypeScriptLegacyWebClient(),
			new TypescriptReactProvider(),
			new TypescriptReactHooks(),
			new Forms(),
		],
		reactNative: [
			...typescriptAll,
			new TypeScriptClient(true),
			new TypeScriptLegacyWebClient(),
			new TypescriptReactNativeProvider(),
			new TypescriptReactHooks(true),
		],
		operations: new Operations(),
		linkBuilder: new TypeScriptLinkBuilder(),
		jsonSchema: new JsonSchema(),
		forms: [new TypescriptReactProvider(), new TypescriptReactHooks(), new Forms()],
	},
};

export default templates;
