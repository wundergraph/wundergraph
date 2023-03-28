import * as z from 'zod';
import * as fs from 'fs';
import type { BaseRequestContext, InternalClient, OperationsClient, WunderGraphUser } from '../server';

export type SubscriptionHandler<
	Input,
	InferredResponse,
	ZodResponse,
	IC extends InternalClient,
	UserRole extends string,
	CustomClaims extends {},
	Queries,
	Mutations,
	Subscriptions
> = ZodResponse extends z.ZodObject<any>
	? (
			ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
	  ) => AsyncGenerator<z.infer<ZodResponse>>
	: (
			ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
	  ) => AsyncGenerator<InferredResponse>;

export type OperationTypes = 'query' | 'mutation' | 'subscription';

interface _HandlerContext<
	Input,
	IC extends InternalClient,
	Role extends string,
	CustomClaims extends {},
	Queries,
	Mutations,
	Subscriptions
> extends BaseRequestContext<WunderGraphUser<Role, CustomClaims>, IC> {
	input: Input extends {} ? Input : never;
	operations: Omit<OperationsClient<Queries, Mutations, Subscriptions>, 'cancelSubscriptions'>;
}

export type HandlerContext<
	Input,
	IC extends InternalClient,
	Role extends string,
	CustomClaims extends {},
	Queries,
	Mutations,
	Subscriptions
> = Input extends z.ZodObject<any>
	? _HandlerContext<z.infer<Input>, IC, Role, CustomClaims, Queries, Mutations, Subscriptions>
	: Omit<_HandlerContext<never, IC, Role, CustomClaims, Queries, Mutations, Subscriptions>, 'input'>;

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

export interface LiveQueryConfig {
	enable: boolean;
	pollingIntervalSeconds: number;
}

const createQuery =
	<IC extends InternalClient, UserRole extends string, CustomClaims extends {}, Queries, Mutations, Subscriptions>() =>
	<Input extends z.ZodObject<any>, InferredResponse, ZodResponse>({
		input,
		response,
		handler,
		live,
		requireAuthentication = false,
		internal = false,
		rbac,
	}: {
		input?: Input;
		response?: ZodResponse;
		handler: ZodResponse extends z.ZodObject<any>
			? (
					ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
			  ) => Promise<z.infer<ZodResponse>>
			: (
					ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
			  ) => Promise<InferredResponse>;
		live?: LiveQueryConfig;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'query',
		IC,
		UserRole,
		CustomClaims,
		Queries,
		Mutations,
		Subscriptions
	> => {
		return {
			type: 'query',
			inputSchema: input,
			responseSchema: response,
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
	<IC extends InternalClient, UserRole extends string, CustomClaims extends {}, Queries, Mutations, Subscriptions>() =>
	<Input extends z.ZodObject<any>, InferredResponse, ZodResponse>({
		input,
		response,
		handler,
		requireAuthentication = false,
		internal = false,
		rbac,
	}: {
		input?: Input;
		response?: ZodResponse;
		handler: ZodResponse extends z.ZodObject<any>
			? (
					ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
			  ) => Promise<z.infer<ZodResponse>>
			: (
					ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
			  ) => Promise<InferredResponse>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'mutation',
		IC,
		UserRole,
		CustomClaims,
		Queries,
		Mutations,
		Subscriptions
	> => {
		return {
			type: 'mutation',
			inputSchema: input,
			responseSchema: response,
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
	<IC extends InternalClient, UserRole extends string, CustomClaims extends {}, Queries, Mutations, Subscriptions>() =>
	<I extends z.ZodObject<any>, InferredResponse, ZodResponse>({
		input,
		handler,
		response,
		requireAuthentication = false,
		internal = false,
		rbac,
	}: {
		input?: I;
		response?: ZodResponse;
		handler: SubscriptionHandler<
			I,
			InferredResponse,
			ZodResponse,
			IC,
			UserRole,
			CustomClaims,
			Queries,
			Mutations,
			Subscriptions
		>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<I>,
		InferredResponse,
		ZodResponse,
		'subscription',
		IC,
		UserRole,
		CustomClaims,
		Queries,
		Mutations,
		Subscriptions
	> => {
		return {
			type: 'subscription',
			subscriptionHandler: handler,
			inputSchema: input,
			responseSchema: response,
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

export const createOperationFactory = <
	IC extends InternalClient,
	UserRole extends string,
	CustomClaims extends {},
	Queries,
	Mutations,
	Subscriptions
>() => ({
	query: createQuery<IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>(),
	mutation: createMutation<IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>(),
	subscription: createSubscription<IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>(),
});

export type NodeJSOperation<
	Input,
	Response,
	ZodResponse,
	OperationType extends OperationTypes,
	IC extends InternalClient,
	UserRole extends string,
	CustomClaims extends {},
	Queries,
	Mutations,
	Subscriptions
> = {
	type: OperationType;
	inputSchema?: z.ZodObject<any>;
	responseSchema?: ZodResponse;
	queryHandler?: ZodResponse extends z.ZodObject<any>
		? (
				ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
		  ) => Promise<z.infer<ZodResponse>>
		: (ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>) => Promise<Response>;
	mutationHandler?: ZodResponse extends z.ZodObject<any>
		? (
				ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>
		  ) => Promise<z.infer<ZodResponse>>
		: (ctx: HandlerContext<Input, IC, UserRole, CustomClaims, Queries, Mutations, Subscriptions>) => Promise<Response>;
	subscriptionHandler?: SubscriptionHandler<
		Input,
		Response,
		ZodResponse,
		IC,
		UserRole,
		CustomClaims,
		Queries,
		Mutations,
		Subscriptions
	>;
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

export type ExtractInput<B> = B extends NodeJSOperation<infer T, any, any, any, any, any, any, any, any, any>
	? T
	: never;
export type ExtractResponse<B> = B extends NodeJSOperation<
	any,
	infer Response,
	infer ZodResponse,
	any,
	any,
	any,
	any,
	any,
	any,
	any
>
	? ZodResponse extends z.ZodObject<any>
		? z.infer<ZodResponse>
		: Response
	: never;

export const loadNodeJsOperationDefaultModule = async (
	operationPath: string
): Promise<NodeJSOperation<any, any, any, any, any, any, any, any, any, any>> => {
	// remove .js or / from the end of operationPath if present
	if (operationPath.endsWith('.cjs')) {
		operationPath = operationPath.slice(0, -4);
	}
	if (operationPath.endsWith('/')) {
		operationPath = operationPath.slice(0, -1);
	}
	const modulePath = operationPath;
	const filePath = modulePath + '.cjs';
	const exists = fs.existsSync(filePath);
	if (!exists) {
		throw new Error(`Operation file not found at ${filePath}`);
	}
	let module: any | undefined;
	try {
		module = await import(filePath);
	} catch (e: any) {
		throw new Error(`Error loading module at ${filePath}: ${e.message}`);
	}
	if (!module || !module.default) {
		throw new Error(`Module at ${filePath} does not export default`);
	}
	return module.default;
};
