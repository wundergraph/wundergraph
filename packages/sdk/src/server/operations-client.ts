import {
	Client,
	ClientConfig,
	ClientResponse,
	MutationRequestOptions,
	OperationRequestOptions,
	QueryRequestOptions,
	SubscriptionRequestOptions,
} from '../client';
import { SpanKind, Tracer, trace, Context, propagation, Span } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { Attributes, Components } from './trace/attributes';
import { attachErrorToSpan, setStatusFromResponseCode } from './trace/util';

// undici fetch supports Node.js 16.8. It's the same implementation as the built-in fetch since Node.js 18.
// We can switch to the built-in fetch once we drop support for Node.js 16.
import { fetch } from 'undici';

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
	/**
	 * raw JSON encoded client request
	 */
	clientRequest: any;
	tracer?: Tracer;
	traceContext?: Context;
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

const forwardedHeaders = ['Authorization', 'X-Request-Id'];

/**
 * This client is used to execute custom operations on the Hooks server (server side only).
 * The implementation is based on the `Client` class which is used on the web and server side.
 * The implementation is an implementation detail and should not be used directly as a public API.
 */
export class OperationsClient<
	Operations extends InternalOperationsDefinition = InternalOperationsDefinition
> extends Client {
	protected readonly csrfEnabled = false;

	protected readonly clientRequest: any;
	protected readonly tracer?: Tracer;
	protected readonly traceContext?: Context;

	constructor(options: OperationsClientConfig) {
		const { clientRequest, customFetch = fetch, ...rest } = options;

		super({
			// fetch compatible but not the exact same type
			customFetch: customFetch as any,
			...rest,
		});

		this.clientRequest = clientRequest;
		if (clientRequest?.headers) {
			for (const header of forwardedHeaders) {
				const value = clientRequest.headers[header];
				if (value) {
					this.baseHeaders[header] = value;
				}
			}
		}
		this.tracer = options.tracer;
		this.traceContext = options.traceContext;
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
		const searchParams = this.searchParams();
		const params: any = { input: options.input, __wg: { clientRequest: this.clientRequest } };

		if (options.subscribeOnce) {
			searchParams.set('wg_subscribe_once', '');
		}

		const url = this.addUrlParams(this.operationUrl(options.operationName), searchParams);
		const res = await this.makeRequest(url, {
			method: 'POST',
			body: this.stringifyInput(params),
			signal: options.abortSignal,
		});

		return this.fetchResponseToClientResponse(res);
	};

	protected async makeRequest(url: string, init: RequestInit = {}) {
		const method = init.method;
		const spanName = `OperationsClient ${method}`;
		let span: Span | undefined;

		// Ensure that we have a headers object to inject into
		init.headers = {
			...init.headers,
		};

		if (this.traceContext && this.tracer) {
			span = this.tracer.startSpan(
				spanName,
				{
					kind: SpanKind.CLIENT,
					attributes: {
						[SemanticAttributes.HTTP_METHOD]: method,
						[SemanticAttributes.HTTP_URL]: url,
						[Attributes.WG_COMPONENT_NAME]: Components.OPERATIONS_CLIENT,
					},
				},
				this.traceContext
			);
			// Inject the span context into the headers
			propagation.inject(trace.setSpan(this.traceContext, span), init.headers);
		}

		try {
			const res = await this.fetchJson(url, init);

			if (span) {
				setStatusFromResponseCode(span, res.status);
				span.setAttributes({
					[SemanticAttributes.HTTP_STATUS_CODE]: res.status,
					[SemanticAttributes.HTTP_RESPONSE_CONTENT_LENGTH]: res.headers.get('content-length') ?? 0,
				});
			}

			return res;
		} catch (err: any) {
			if (span) {
				// Mark the request as errored and attach information about the error
				attachErrorToSpan(span, err);
			}
			// Rethrow the error, we don't want to change the error handling
			throw err;
		} finally {
			span?.end();
		}
	}

	public mutate = async <
		OperationName extends Extract<keyof Operations['mutations'], string>,
		Input extends Operations['mutations'][OperationName]['input'] = Operations['mutations'][OperationName]['input'],
		TResponse extends Operations['mutations'][OperationName]['response'] = Operations['mutations'][OperationName]['response']
	>(
		options: OperationName extends string ? MutationRequestOptions<OperationName, Input> : OperationRequestOptions
	): Promise<ClientResponse<TResponse['data'], TResponse['error']>> => {
		return this.query(options as any);
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
		if (options.subscribeOnce) {
			const self = this;
			const generator = async function* () {
				const res = await self.query(options);
				yield res;
			};
			return generator() as any;
		}

		const sub = await this.subscribeWithFetch(options);

		this.subscriptions.push(sub);

		return sub as any;
	};

	protected async fetchSubscription<Data = any, Error = any>(
		subscription: SubscriptionRequestOptions
	): Promise<Response> {
		const searchParams = this.searchParams();
		const params: any = { input: subscription.input, __wg: { clientRequest: this.clientRequest } };

		if (subscription.liveQuery) {
			searchParams.set('wg_live', '');
		}

		const url = this.addUrlParams(this.operationUrl(subscription.operationName), searchParams);
		return await this.makeRequest(url, {
			method: 'POST',
			body: this.stringifyInput(params),
			signal: subscription.abortSignal,
		});
	}
}
