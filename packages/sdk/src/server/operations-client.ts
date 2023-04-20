import fetch from 'cross-fetch';
import type { Readable } from 'stream';
import {
	Client,
	ClientConfig,
	ClientResponse,
	MutationRequestOptions,
	OperationRequestOptions,
	QueryRequestOptions,
	SubscriptionEventHandler,
	SubscriptionRequestOptions,
} from '../client';

export interface Operation<Input extends object, Response> {
	input: Input;
	response: Response;
}

export interface Operations {
	[key: string]: Operation<object, unknown>;
}

export interface Options {
	baseURL: string;
	extraHeaders?: { [key: string]: string };
	clientRequest: any;
}

export interface OperationsClientConfig extends Omit<ClientConfig, 'csrfEnabled'> {
	clientRequest: any;
}

export type InternalOperation = {
	input?: object;
	response: ClientResponse;
};

export type InternalOperationDefinition = {
	[key: string]: InternalOperation;
};

export type InternalOperationsDefinition<
	Queries extends InternalOperationDefinition = InternalOperationDefinition,
	Mutations extends InternalOperationDefinition = InternalOperationDefinition,
	Subscriptions extends InternalOperationDefinition = InternalOperationDefinition
> = {
	queries: Queries;
	mutations: Mutations;
	subscriptions: Subscriptions;
};

export class OperationsClient<
	Operations extends InternalOperationsDefinition = InternalOperationsDefinition
> extends Client {
	protected readonly csrfEnabled = false;

	protected readonly clientRequest: any;

	constructor(options: OperationsClientConfig) {
		const { clientRequest, customFetch = fetch, ...rest } = options;
		super(rest);

		this.clientRequest = clientRequest;
	}

	protected operationUrl(operationName: string) {
		return this.options.baseURL + '/operations/' + operationName;
	}

	private subscriptions: AsyncGenerator<any>[] = [];

	public cancelSubscriptions() {
		this.subscriptions.forEach((sub) => sub.return(0));
	}

	public withHeaders = (headers: { [key: string]: string }) => {
		return new OperationsClient<Operations>({
			...this.options,
			extraHeaders: headers,
			clientRequest: this.clientRequest,
		});
	};

	public query = async <
		OperationName extends Extract<keyof Operations['queries'], string>,
		Input extends Operations['queries'][OperationName]['input'] = Operations['queries'][OperationName]['input'],
		TResponse extends Operations['queries'][OperationName]['response'] = Operations['queries'][OperationName]['response']
	>(
		options: OperationName extends string ? QueryRequestOptions<OperationName, Input> : OperationRequestOptions
	): Promise<ClientResponse<TResponse['data'], TResponse['error']>> => {
		const params: any = { input: options.input, __wg: { clientRequest: this.clientRequest } };

		if (options.subscribeOnce) {
			params.wg_subscribe_once = '';
		}

		const url = this.operationUrl(options.operationName);
		const res = await this.fetchJson(url, {
			method: 'POST',
			body: this.stringifyInput(params),
			signal: options.abortSignal,
		});

		return this.fetchResponseToClientResponse(res);
	};

	public mutate = async <
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		TResponse extends Operations['mutations'][OperationName]['response'] = Operations['mutations'][OperationName]['response']
	>(
		options: OperationName extends string ? MutationRequestOptions<OperationName, Input> : OperationRequestOptions
	): Promise<ClientResponse<TResponse['data'], TResponse['error']>> => {
		return super.mutate(options);
	};

	/**
	 * Sets up a subscription using web streams.
	 * @returns AsyncGenerator that yields the subscription events
	 * @see https://docs.wundergraph.com/docs/architecture/wundergraph-rpc-protocol-explained#subscriptions
	 */
	public subscribe = async <
		OperationName extends Extract<keyof Operations['subscriptions'], string>,
		Input extends Operations['subscriptions'][OperationName]['input'] = Operations['subscriptions'][OperationName]['input'],
		TResponse extends Operations['subscriptions'][OperationName]['response'] = Operations['subscriptions'][OperationName]['response'],
		ReturnType = AsyncGenerator<ClientResponse<TResponse['data'], TResponse['error']>>
	>(
		options: OperationName extends string ? SubscriptionRequestOptions<OperationName, Input> : OperationRequestOptions
	): Promise<ReturnType> => {
		const sub = await super.subscribeWithFetch(options);

		this.subscriptions.push(sub);

		return sub as any;
	};
}
