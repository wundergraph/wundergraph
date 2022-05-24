import {
	TypeScriptInjectedInputModels,
	TypeScriptInputModels,
	TypeScriptInternalInputModels,
	TypeScriptResponseDataModels,
	TypeScriptResponseModels,
} from './typescript';
import { TypeScriptWebClient } from './typescript/web.client';
import { TypescriptReactHooks, TypescriptReactNativeProvider, TypescriptReactProvider } from './typescript/react';
import { Operations } from './typescript/operations';
import { TypeScriptLinkBuilder } from './typescript/linkbuilder';
import { JsonSchema } from './typescript/jsonschema';
import { Forms } from './typescript/forms';
import { WunderGraphServer } from './typescript/server';
import { WunderGraphHooksPlugin } from './typescript/hooks';
import { AuthenticationProviderConfiguration } from './markdown/authentication';

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
	new Operations(),
	new JsonSchema(),
];

const templates = {
	typescript: {
		// models generates all models for input and output
		models: typescriptModels,
		inputModels: new TypeScriptInputModels(),
		responseModels: new TypeScriptResponseModels(),
		client: new TypeScriptWebClient(),
		all: [...typescriptAll, new TypeScriptWebClient(), new AuthenticationProviderConfiguration()],
		fastifyServer: new WunderGraphServer(),
		fastifyHooksPlugin: new WunderGraphHooksPlugin(),
		react: [
			...typescriptAll,
			new TypeScriptWebClient(),
			new TypescriptReactProvider(),
			new TypescriptReactHooks(),
			new Forms(),
		],
		reactNative: [
			...typescriptAll,
			new TypeScriptWebClient(true),
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
