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

import { JSONObject } from '../server/types';
import { wellKnownTypeNames } from '../definition/namespacing';
import { Logger } from '../logger';

interface GraphQLResult<T = unknown> {
	data?: T;
	errors?: GraphQLError[];
}

export interface NamespacingExecutorConfig {
	baseUrl: string;
	fetch?: typeof globalThis.fetch;
	namespace?: string;
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
		variables?: Record<string, unknown> | undefined
	): Promise<T> {
		const transformedDocument = this.config.namespace ? this.#namespaceOperation(document) : document;
		const body = JSON.stringify(this.#buildOperationPayload(transformedDocument, variables));

		if (operation === OperationTypeNode.SUBSCRIPTION) {
			// we create an abort signal to manage request cancellation
			// upon disconnect from the initiating WunderGraph custom operation
			const controller = new AbortController();
			const generator = this.#fetchMany(body, controller.signal);
			// this is setup by the WunderGraph server
			globalThis.__OPERATIONS_ASYNC_STORAGE__?.getStore()?.ormOperationControllers.push(controller);

			return generator as any;
		} else {
			const response = await this.#fetch(body);
			const json = await response.json();
			return this.#processJson(json);
		}
	}

	// @todo utilize (or re-implement for now) `Client` methods from `./client/client.ts`
	// OR just take an `InternalClient` instance

	#buildOperationPayload(document: DocumentNode, variables?: Record<string, unknown> | undefined) {
		return {
			operationName: undefined,
			query: print(document),
			variables,
		};
	}

	#processJson(json: any) {
		// @todo make this runtime safe
		const result = json as GraphQLResult;

		if (typeof result.data !== 'object') {
			const errorMessage = result.errors?.map((error) => error.message).join('. ') ?? '';
			throw new Error(`Operation execution did not return a successful result. Received errors: "${errorMessage}".`);
		}

		if (this.config.namespace) {
			const transformedResult = this.#transformResult(result.data as any /* @todo */);
			return transformedResult;
		} else {
			return result.data;
		}
	}

	#applyNamespace(name: string): string {
		if (this.config.namespace) {
			return `${this.config.namespace}_${name}`;
		} else {
			throw new Error('No namespace is configured.');
		}
	}

	#removeNamespace(name: string): string {
		if (this.config.namespace) {
			return name.replace(`${this.config.namespace}_`, '');
		} else {
			throw new Error('No namespace is configured.');
		}
	}

	// we need to de-namespace responses (i.e root object field keys and `__typename` field values)
	#transformResult(result: JSONObject) {
		// We can't use non this-binding arrow functions w/`traverse`
		const self = this;

		return traverse(result).map(function (value: any) {
			// update root field keys
			if (this.isRoot && typeof value === 'object') {
				const renamed = Object.fromEntries(Object.entries(value).map(([k, v]) => [self.#removeNamespace(k), v]));
				this.update(renamed);
			}

			// update `__typename` values
			if (this.key === '__typename' && typeof value === 'string') {
				const renamed = self.#removeNamespace(value);
				this.update(renamed);
			}
		});
	}

	#namespaceOperation(document: DocumentNode): DocumentNode {
		return visit(document, {
			[Kind.OPERATION_DEFINITION]: (node): OperationDefinitionNode => {
				return {
					...node,
					selectionSet: {
						...node.selectionSet,
						selections: node.selectionSet.selections.map((selection) => {
							if (selection.kind === Kind.FIELD) {
								return { ...selection, name: { kind: Kind.NAME, value: this.#applyNamespace(selection.name.value) } };
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
							value: this.#applyNamespace(node.name.value),
						},
					};
				}
			},
		});
	}

	// @todo error handling
	// @note we can copy `graphql-request`'s implementation (or just use them)
	// https://github.com/jasonkuhrt/graphql-request/blob/main/src/index.ts
	async *#fetchMany(body: any, signal?: AbortSignal) {
		const response = await this.#fetch(body, signal);
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
				yield this.#processJson(lastResponse);
				message = '';
			}
		}
	}

	async #fetch(body: globalThis.BodyInit, signal?: AbortSignal) {
		const fetchImp = this.config.fetch ?? fetch;

		const headers = {
			'Content-Type': 'application/json',
			Accept: 'text/event-stream',
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
