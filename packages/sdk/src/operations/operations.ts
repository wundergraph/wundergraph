import { z } from 'zod';
import * as fs from 'fs';
import type { BaseRequestContext, InternalClient } from '../server';
import type { WunderGraphUser } from '../server';

export type SubscriptionHandler<I, R, IC extends InternalClient, UserRole extends string> = (
	ctx: HandlerContext<I, IC, UserRole>
) => AsyncGenerator<R>;
export type OperationTypes = 'query' | 'mutation' | 'subscription';

interface _HandlerContext<Input, IC extends InternalClient, Role extends string>
	extends BaseRequestContext<WunderGraphUser<Role>, IC> {
	input: Input extends {} ? Input : never;
}

export type HandlerContext<I, IC extends InternalClient, Role extends string> = I extends z.AnyZodObject
	? _HandlerContext<z.infer<I>, IC, Role>
	: Omit<_HandlerContext<never, IC, Role>, 'input'>;

export interface BaseOperationConfiguration<UserRole extends string> {
	requireAuthentication?: boolean;
	internal?: boolean;
	rbac?: {
		requireMatchAll?: UserRole[];
		requireMatchAny?: UserRole[];
		denyMatchAll?: UserRole[];
		denyMatchAny?: UserRole[];
	};
}

interface LiveQueryConfig {
	enable: boolean;
	pollingIntervalSeconds: number;
}

const createQuery =
	<IC extends InternalClient, UserRole extends string>() =>
	<I extends z.AnyZodObject, R>({
		input,
		handler,
		live,
		requireAuthentication = false,
		internal = false,
		rbac,
	}: {
		input?: I;
		handler: (ctx: HandlerContext<I, IC, UserRole>) => Promise<R>;
		live?: LiveQueryConfig;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<z.infer<I>, R, 'query', IC, UserRole> => {
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

const createMutation =
	<IC extends InternalClient, UserRole extends string>() =>
	<I extends z.AnyZodObject, R>({
		input,
		handler,
		requireAuthentication = false,
		internal = false,
		rbac,
	}: {
		input?: I;
		handler: (ctx: HandlerContext<I, IC, UserRole>) => Promise<R>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<z.infer<I>, R, 'mutation', IC, UserRole> => {
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

const createSubscription =
	<IC extends InternalClient, UserRole extends string>() =>
	<I extends z.AnyZodObject, R>({
		input,
		handler,
		requireAuthentication = false,
		internal = false,
		rbac,
	}: {
		input?: I;
		handler: SubscriptionHandler<I, R, IC, UserRole>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<z.infer<I>, R, 'subscription', IC, UserRole> => {
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

export const createOperationFactory = <IC extends InternalClient, UserRole extends string>() => ({
	query: createQuery<IC, UserRole>(),
	mutation: createMutation<IC, UserRole>(),
	subscription: createSubscription<IC, UserRole>(),
});

export type NodeJSOperation<
	Input,
	Response,
	OperationType extends OperationTypes,
	IC extends InternalClient,
	UserRole extends string
> = {
	type: OperationType;
	inputSchema?: z.ZodObject<any>;
	queryHandler?: (ctx: HandlerContext<Input, IC, UserRole>) => Promise<Response>;
	mutationHandler?: (ctx: HandlerContext<Input, IC, UserRole>) => Promise<Response>;
	subscriptionHandler?: SubscriptionHandler<Input, Response, IC, UserRole>;
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

export type ExtractInput<B> = B extends NodeJSOperation<infer T, any, any, any, any> ? T : never;
export type ExtractResponse<B> = B extends NodeJSOperation<any, infer T, any, any, any> ? T : never;

export const loadNodeJsOperationDefaultModule = async (
	operationPath: string
): Promise<NodeJSOperation<any, any, any, any, any>> => {
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
