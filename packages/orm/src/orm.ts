import { OperationCreator } from './operation-creator';
import type { Executor } from './executor';

export interface ORMConfig {
	apis: Record<string, any>;
	executor: Executor;
	extraHeaders?: Record<string, string>;
	rawClientRequest?: any;
}

export class ORM<Schemas extends Record<string, any>> {
	constructor(public readonly config: ORMConfig) {}

	from<Namespace extends Extract<keyof Schemas, string>>(
		namespace: Namespace
	): OperationCreator<{ schema: Schemas[Namespace] }> {
		return new OperationCreator<{ schema: Schemas[Namespace] }>({
			schema: (this.config.apis as any)[namespace],
			executor: this.config.executor,
			namespace,
			extraHeaders: this.config.extraHeaders,
			rawClientRequest: this.config.rawClientRequest,
		});
	}

	withHeaders(headers: Record<string, string>): ORM<Schemas> {
		return new ORM<Schemas>({
			...this.config,
			extraHeaders: headers,
		});
	}

	withRawClientRequest(rawClientRequest?: any): ORM<Schemas> {
		return new ORM<Schemas>({
			...this.config,
			rawClientRequest,
		});
	}
}
