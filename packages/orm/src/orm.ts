import { OperationCreator } from './operation-creator';
import type { Executor } from './executor';
import { ClientRequest } from './internal-types';

export interface ORMConfig {
	apis: Record<string, any>;
	executor: Executor;
	clientRequest?: ClientRequest;
	extraHeaders?: Record<string, string>;
}

/**
 * WunderGraph ORM Client
 *
 * @see Docs https://docs.wundergraph.com/docs/typescript-orm-reference
 */
export class ORM<Schemas extends Record<string, any>> {
	constructor(public readonly config: ORMConfig) {}

	from<Namespace extends Extract<keyof Schemas, string>>(
		namespace: Namespace
	): OperationCreator<{ schema: Schemas[Namespace] }> {
		return new OperationCreator<{ schema: Schemas[Namespace] }>({
			schema: (this.config.apis as any)[namespace],
			executor: this.config.executor,
			namespace,
			clientRequest: this.config.clientRequest,
			extraHeaders: this.config.extraHeaders,
		});
	}

	withHeaders(headers: Record<string, string>): ORM<Schemas> {
		return new ORM<Schemas>({
			...this.config,
			extraHeaders: headers,
		});
	}

	withClientRequest(clientRequest: ClientRequest): ORM<Schemas> {
		return new ORM<Schemas>({
			...this.config,
			clientRequest,
		});
	}
}
