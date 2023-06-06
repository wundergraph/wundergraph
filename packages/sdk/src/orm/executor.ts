import {
	type OperationDefinitionNode,
	type DocumentNode,
	type GraphQLError,
	OperationTypeNode,
	Kind,
	visit,
	print,
} from 'graphql';
import { type Executor } from '@wundergraph/orm';
import traverse from 'traverse';
import { applyPatch } from 'fast-json-patch';
import { fetch } from '@whatwg-node/fetch';
import { from } from 'ix/asynciterable';
import { map } from 'ix/asynciterable/operators';

import { JSONObject } from '../server/types';
import { wellKnownTypeNames } from '../definition/namespacing';
import { Logger } from '../logger';
import type { OperationsAsyncContext } from '../server/operations-context';

interface GraphQLResult<T = unknown> {
	data?: T;
	errors?: GraphQLError[];
}

export interface NamespacingExecutorConfig {
	baseUrl: string;
	requestContext: OperationsAsyncContext;
	fetch?: typeof globalThis.fetch;
}

interface FetchOptions {
	signal?: AbortSignal;
	extraHeaders?: Record<string, string>;
}

// @note this is just a POC implementation meant to be used for
// testing the WunderGraph integration. It needs a lot of work
// before it could be used in production.
//
// @todo we could make this generic enough to implement in
// the `@wundergraph/orm` package (i.e support a middleware-style
// API like `graphql-request` does).

// @todo extend `Client` if possible (is it meant for interfacing with the "native" GraphQL API's the WunderNode exposes?)
export class NamespacingExecutor implements Executor {
	readonly url: string;

	constructor(public readonly config: NamespacingExecutorConfig) {
		this.url = `${this.config.baseUrl}/graphql`;
	}

	async execute<T>(
		operation: OperationTypeNode,
		document: DocumentNode,
		variables?: Record<string, unknown> | undefined,
		namespace?: string,
		extraHeaders?: Record<string, string> | undefined,
		rawClientRequest?: any
	): Promise<T> {
		const transformedDocument = namespace ? this.#namespaceOperation(document, namespace) : document;
		const body = JSON.stringify(this.#buildOperationPayload(transformedDocument, variables, rawClientRequest));

		if (operation === OperationTypeNode.SUBSCRIPTION) {
			// we create an abort signal to manage request cancellation
			// upon disconnect from the initiating WunderGraph custom operation
			const controller = new AbortController();
			const generator = from(this.#fetchMany(body, { signal: controller.signal, extraHeaders })).pipe(
				map((result) => this.#processJson(result, namespace))
			);
			// hook into our server's request context
			this.config.requestContext.getStore()?.ormOperationControllers.push(controller);

			return generator as any;
		} else {
			const response = await this.#fetch(body, { extraHeaders });
			const json = await response.json();
			return this.#processJson(json, namespace);
		}
	}

	// @todo utilize (or re-implement for now) `Client` methods from `./client/client.ts`
	// OR just take an `InternalClient` instance

	#buildOperationPayload(
		document: DocumentNode,
		variables?: Record<string, unknown> | undefined,
		rawClientRequest?: any
	) {
		const payload: {
			operationName: undefined;
			query: string;
			variables?: Record<string, unknown>;
			__wg?: any;
		} = {
			operationName: undefined,
			query: print(document),
			variables,
		};
		if (rawClientRequest != null) {
			payload.__wg = {
				clientRequest: rawClientRequest,
			};
		}
		return payload;
	}

	#processJson(json: any, namespace?: string) {
		// @todo make this runtime safe
		const result = json as GraphQLResult;

		if (typeof result.data !== 'object' || result.data === null) {
			const errorMessage = result.errors?.map((error) => error.message).join('. ') ?? '';
			throw new Error(`Operation execution did not return a successful result. Received errors: "${errorMessage}".`);
		}

		if (namespace) {
			const transformedResult = this.#transformResult(result.data as any /* @todo */, namespace);
			return transformedResult;
		} else {
			return result.data;
		}
	}

	#applyNamespace(name: string, namespace: string): string {
		if (namespace) {
			return `${namespace}_${name}`;
		} else {
			throw new Error('No namespace is configured.');
		}
	}

	#removeNamespace(name: string, namespace: string): string {
		if (namespace) {
			return name.replace(`${namespace}_`, '');
		} else {
			throw new Error('No namespace is configured.');
		}
	}

	// we need to de-namespace responses (i.e root object field keys and `__typename` field values)
	#transformResult(result: JSONObject, namespace: string) {
		// We can't use non this-binding arrow functions w/`traverse`
		const self = this;

		return traverse(result).map(function (value: any) {
			// update root field keys
			if (this.isRoot && typeof value === 'object') {
				const renamed = Object.fromEntries(
					Object.entries(value).map(([k, v]) => [self.#removeNamespace(k, namespace), v])
				);
				this.update(renamed);
			}

			// update `__typename` values
			if (this.key === '__typename' && typeof value === 'string') {
				const renamed = self.#removeNamespace(value, namespace);
				this.update(renamed);
			}
		});
	}

	#namespaceOperation(document: DocumentNode, namespace: string): DocumentNode {
		return visit(document, {
			[Kind.OPERATION_DEFINITION]: (node): OperationDefinitionNode => {
				return {
					...node,
					selectionSet: {
						...node.selectionSet,
						selections: node.selectionSet.selections.map((selection) => {
							if (selection.kind === Kind.FIELD) {
								return {
									...selection,
									name: { kind: Kind.NAME, value: this.#applyNamespace(selection.name.value, namespace) },
								};
							} else {
								return selection;
							}
						}),
					},
				};
			},

			[Kind.NAMED_TYPE]: (node) => {
				if (!wellKnownTypeNames.includes(node.name.value)) {
					return {
						...node,
						name: {
							...node.name,
							value: this.#applyNamespace(node.name.value, namespace),
						},
					};
				}
			},
		});
	}

	// @todo error handling
	// @note we can copy `graphql-request`'s implementation (or just use them)
	// https://github.com/jasonkuhrt/graphql-request/blob/main/src/index.ts
	async *#fetchMany(body: any, opts: FetchOptions) {
		const response = await this.#fetch(body, opts);
		//
		// `@whatwg-node/fetch` implementation (better since it implements a standard / doesn't rely on Node's custom implementation)
		//
		// @note we expect the `fetch` implementation to conform to the WHATWG `fetch` standard. Importantly,
		// this includes returning a spec-conforming `ReadableStream` the `Response.body` type. We utilize
		// `getReader()` to consume the HTTP event stream events.
		const reader = response.body?.getReader();
		if (!reader) {
			// see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader
			throw new Error("`fetch` implementation does not implement `getReader()` on it's `Response.body`.");
		}
		const decoder = new TextDecoder();

		// we need to handle rejections of `reader.closed` as this
		// is what indicates to us that the stream has errored. Importantly,
		// it will also be rejected when the stream is cancelled with an `AbortSignal`.
		//
		// See https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/closed
		reader.closed.catch((reason) => {
			// @note ideally we can check for an instance of `AbortError`
			if (reason instanceof Error && reason.message.includes('abort')) {
				Logger.debug("SSE's ReadableStream was cancelled.");
			} else {
				// @todo propogate this error from our generator (we can't simply throw from this callback)
				Logger.error(`SSE\'s ReadableStream was closed due to error. Error "${reason}".`);
			}
		});

		let message: string = '';
		let lastResponse: GraphQLResult | null = null;

		while (true) {
			const { value, done } = await reader.read();

			if (done) return;
			if (!value) continue;

			message += decoder.decode(value);
			if (message.endsWith('\n\n')) {
				const jsonResp = JSON.parse(message.substring(0, message.length - 2));
				if (lastResponse !== null && Array.isArray(jsonResp)) {
					lastResponse = applyPatch(lastResponse, jsonResp).newDocument as GraphQLResult;
				} else {
					lastResponse = jsonResp as GraphQLResult;
				}
				yield lastResponse;
				message = '';
			}
		}
	}

	async #fetch(body: globalThis.BodyInit, opts: FetchOptions) {
		const { signal, extraHeaders = {} } = opts;
		const fetchImp = this.config.fetch ?? fetch;

		const headers = {
			'Content-Type': 'application/json',
			Accept: 'text/event-stream',
			...extraHeaders,
		};

		// @todo check `res.ok` before requesting JSON w/ `res.json`
		return await fetchImp(this.url, {
			headers,
			method: 'POST',
			body,
			signal,
		});
	}
}
