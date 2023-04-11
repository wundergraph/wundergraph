import { Client, OperationsDefinition, ResponseError } from '@wundergraph/sdk/client';
import { createWunderGraphRelayApp } from '../src/';

interface Operations extends OperationsDefinition {
	queries: {
		Weather: {
			input: {
				city: string;
			};
			response: { data?: { temperature: number }; error?: ResponseError };
			requiresAuthentication: boolean;
		};
	};
	subscriptions: {
		Weather: {
			input: {
				forCity: string;
			};
			response: { data?: { temperature: number }; error?: ResponseError };
			requiresAuthentication: boolean;
		};
	};
	mutations: {
		CreateUser: {
			input: {
				name: string;
			};
			response: { data?: { name: string }; error?: ResponseError };
			requiresAuthentication: boolean;
		};
	};
}

const client = new Client({
	baseURL: 'http://localhost:8080',
	applicationHash: 'my-application-hash',
	sdkVersion: '0.0.0',
});
