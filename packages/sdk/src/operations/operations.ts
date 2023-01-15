import { z } from 'zod';
import * as fs from 'fs';
import { BaseRequestContext } from '../server';
import type { User } from '../client';
import type { InternalClient } from '../server';

export type SubscriptionHandler<I, R> = (ctx: HandlerContext<I>) => AsyncGenerator<R>;
export type OperationTypes = 'query' | 'mutation' | 'subscription';

export interface HandlerContext<Input> extends BaseRequestContext<User, InternalClient> {
	input: Input extends {} ? Input : never;
}

export interface BaseOperationConfiguration {
	requireAuthentication?: boolean;
	internal?: boolean;
	rbac?: {
		requireMatchAll?: string[];
		requireMatchAny?: string[];
		denyMatchAll?: string[];
		denyMatchAny?: string[];
	};
}

interface LiveQueryConfig {
	enable: boolean;
	pollingIntervalSeconds: number;
}

const createQuery = <I extends z.AnyZodObject, R>({
	input,
	handler,
	live,
	requireAuthentication = false,
	internal = false,
	rbac,
}: {
	input?: I;
	handler: (ctx: HandlerContext<z.infer<I>>) => Promise<R>;
	live?: LiveQueryConfig;
} & BaseOperationConfiguration): NodeJSOperation<z.infer<I>, R, 'query'> => {
	return {
		type: 'query',
		inputSchema: input,
		queryHandler: handler,
		internal: internal || false,
		requireAuthentication: requireAuthentication,
		rbac: {
			denyMatchAll: rbac?.denyMatchAll || [],
			denyMatchAny: rbac?.denyMatchAny || [],
			requireMatchAll: rbac?.requireMatchAll || [],
			requireMatchAny: rbac?.requireMatchAny || [],
		},
		liveQuery: {
			enable: live?.enable || true,
			pollingIntervalSeconds: live?.pollingIntervalSeconds || 5,
		},
	};
};

const createMutation = <I extends z.AnyZodObject, R>({
	input,
	handler,
	requireAuthentication = false,
	internal = false,
	rbac,
}: {
	input: I;
	handler: (ctx: HandlerContext<z.infer<I>>) => Promise<R>;
} & BaseOperationConfiguration): NodeJSOperation<z.infer<I>, R, 'mutation'> => {
	return {
		type: 'mutation',
		inputSchema: input,
		mutationHandler: handler,
		internal: internal || false,
		requireAuthentication: requireAuthentication,
		rbac: {
			denyMatchAll: rbac?.denyMatchAll || [],
			denyMatchAny: rbac?.denyMatchAny || [],
			requireMatchAll: rbac?.requireMatchAll || [],
			requireMatchAny: rbac?.requireMatchAny || [],
		},
		liveQuery: {
			enable: false,
			pollingIntervalSeconds: 0,
		},
	};
};

const createSubscription = <I extends z.AnyZodObject, R>({
	input,
	handler,
	requireAuthentication = false,
	internal = false,
	rbac,
}: {
	input: I;
	handler: SubscriptionHandler<z.infer<I>, R>;
} & BaseOperationConfiguration): NodeJSOperation<z.infer<I>, R, 'subscription'> => {
	return {
		type: 'subscription',
		subscriptionHandler: handler,
		inputSchema: input,
		internal: internal || false,
		requireAuthentication: requireAuthentication,
		rbac: {
			denyMatchAll: rbac?.denyMatchAll || [],
			denyMatchAny: rbac?.denyMatchAny || [],
			requireMatchAll: rbac?.requireMatchAll || [],
			requireMatchAny: rbac?.requireMatchAny || [],
		},
		liveQuery: {
			enable: false,
			pollingIntervalSeconds: 0,
		},
	};
};

export const createOperation = {
	query: createQuery,
	mutation: createMutation,
	subscription: createSubscription,
};

export type NodeJSOperation<Input, Response, OperationType extends OperationTypes> = {
	type: OperationType;
	inputSchema?: z.ZodObject<any>;
	queryHandler?: (ctx: HandlerContext<Input>) => Promise<Response>;
	mutationHandler?: (ctx: HandlerContext<Input>) => Promise<Response>;
	subscriptionHandler?: SubscriptionHandler<Input, Response>;
	requireAuthentication?: boolean;
	internal: boolean;
	liveQuery: {
		enable: boolean;
		pollingIntervalSeconds: number;
	};
	rbac: {
		requireMatchAll: string[];
		requireMatchAny: string[];
		denyMatchAll: string[];
		denyMatchAny: string[];
	};
};

export type ExtractInput<B> = B extends NodeJSOperation<infer T, any, any> ? T : never;
export type ExtractResponse<B> = B extends NodeJSOperation<any, infer T, any> ? T : never;

export const loadNodeJsOperationDefaultModule = async (
	operationPath: string
): Promise<NodeJSOperation<any, any, any>> => {
	// remove .js or / from the end of operationPath if present
	if (operationPath.endsWith('.js')) {
		operationPath = operationPath.slice(0, -3);
	}
	if (operationPath.endsWith('/')) {
		operationPath = operationPath.slice(0, -1);
	}
	const modulePath = operationPath;
	const filePath = modulePath + '.js';
	const exists = fs.existsSync(filePath);
	if (!exists) {
		throw new Error(`Operation file not found at ${filePath}`);
	}
	let module: any | undefined;
	try {
		module = await import(modulePath);
	} catch (e: any) {
		throw new Error(`Error loading module at ${filePath}: ${e.message}`);
	}
	if (!module || !module.default) {
		throw new Error(`Module at ${filePath} does not export default`);
	}
	return module.default;
};
