import * as z from 'zod';
import * as fs from 'fs';
import type { BaseRequestContext, InternalClient, OperationsClient, WunderGraphUser } from '../server';
import { OperationError } from '../client';

export type SubscriptionHandler<
	Input,
	InferredResponse,
	ZodResponse,
	IC extends InternalClient,
	UserRole extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient
> = ZodResponse extends z.ZodObject<any>
	? (
			ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>
	  ) => AsyncGenerator<z.infer<ZodResponse>>
	: (
			ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>
	  ) => AsyncGenerator<InferredResponse>;

export type OperationTypes = 'query' | 'mutation' | 'subscription';

interface _HandlerContext<
	Input,
	IC extends InternalClient,
	Role extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient
> extends BaseRequestContext<WunderGraphUser<Role, CustomClaims>, IC> {
	input: Input extends {} ? Input : never;
	operations: Omit<InternalOperationsClient, 'cancelSubscriptions'>;
}

export type HandlerContext<
	Input,
	IC extends InternalClient,
	Role extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient
> = Input extends z.ZodObject<any>
	? _HandlerContext<z.infer<Input>, IC, Role, CustomClaims, InternalOperationsClient>
	: Omit<_HandlerContext<never, IC, Role, CustomClaims, InternalOperationsClient>, 'input'>;

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
	<
		IC extends InternalClient,
		UserRole extends string,
		CustomClaims extends {},
		InternalOperationsClient extends OperationsClient
	>() =>
	<Input extends z.ZodObject<any> = any, InferredResponse = any, ZodResponse = any>({
		input,
		response,
		handler,
		live,
		requireAuthentication = false,
		internal = false,
		rbac,
		errors = [],
	}: {
		input?: Input;
		errors?: { new (): OperationError }[];
		response?: ZodResponse;
		handler: ZodResponse extends z.ZodObject<any>
			? (
					ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>
			  ) => Promise<z.infer<ZodResponse>>
			: (ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>) => Promise<InferredResponse>;
		live?: LiveQueryConfig;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'query',
		IC,
		UserRole,
		CustomClaims,
		InternalOperationsClient
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
			errors,
			liveQuery: {
				enable: live?.enable || true,
				pollingIntervalSeconds: live?.pollingIntervalSeconds || 5,
			},
		};
	};

const createMutation =
	<
		IC extends InternalClient,
		UserRole extends string,
		CustomClaims extends {},
		InternalOperationsClient extends OperationsClient
	>() =>
	<Input extends z.ZodObject<any> = any, InferredResponse = any, ZodResponse = any>({
		input,
		response,
		handler,
		requireAuthentication = false,
		internal = false,
		rbac,
		errors = [],
	}: {
		input?: Input;
		errors?: { new (): OperationError }[];
		response?: ZodResponse;
		handler: ZodResponse extends z.ZodObject<any>
			? (
					ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>
			  ) => Promise<z.infer<ZodResponse>>
			: (ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>) => Promise<InferredResponse>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'mutation',
		IC,
		UserRole,
		CustomClaims,
		InternalOperationsClient
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
			errors,
			liveQuery: {
				enable: false,
				pollingIntervalSeconds: 0,
			},
		};
	};

const createSubscription =
	<
		IC extends InternalClient,
		UserRole extends string,
		CustomClaims extends {},
		InternalOperationsClient extends OperationsClient
	>() =>
	<Input extends z.ZodObject<any> = any, InferredResponse = any, ZodResponse = any>({
		input,
		handler,
		response,
		requireAuthentication = false,
		internal = false,
		rbac,
		errors = [],
	}: {
		input?: Input;
		errors?: { new (): OperationError }[];
		response?: ZodResponse;
		handler: SubscriptionHandler<
			Input,
			InferredResponse,
			ZodResponse,
			IC,
			UserRole,
			CustomClaims,
			InternalOperationsClient
		>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'subscription',
		IC,
		UserRole,
		CustomClaims,
		InternalOperationsClient
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
			errors,
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
	InternalOperationsClient extends OperationsClient
>() => ({
	query: createQuery<IC, UserRole, CustomClaims, InternalOperationsClient>(),
	mutation: createMutation<IC, UserRole, CustomClaims, InternalOperationsClient>(),
	subscription: createSubscription<IC, UserRole, CustomClaims, InternalOperationsClient>(),
});

export type NodeJSOperation<
	Input,
	Response,
	ZodResponse,
	OperationType extends OperationTypes,
	IC extends InternalClient,
	UserRole extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient
> = {
	type: OperationType;
	inputSchema?: z.ZodObject<any>;
	responseSchema?: ZodResponse;
	queryHandler?: ZodResponse extends z.ZodObject<any>
		? (
				ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>
		  ) => Promise<z.infer<ZodResponse>>
		: (ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>) => Promise<Response>;
	mutationHandler?: ZodResponse extends z.ZodObject<any>
		? (
				ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>
		  ) => Promise<z.infer<ZodResponse>>
		: (ctx: HandlerContext<Input, IC, UserRole, CustomClaims, InternalOperationsClient>) => Promise<Response>;
	subscriptionHandler?: SubscriptionHandler<
		Input,
		Response,
		ZodResponse,
		IC,
		UserRole,
		CustomClaims,
		InternalOperationsClient
	>;
	errors?: { new (): OperationError }[];
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

export type ExtractInput<B> = B extends NodeJSOperation<infer T, any, any, any, any, any, any, any> ? T : never;
export type ExtractResponse<B> = B extends NodeJSOperation<
	any,
	infer Response,
	infer ZodResponse,
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
): Promise<NodeJSOperation<any, any, any, any, any, any, any, any>> => {
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
		throw new Error(`Error loading module at ${filePath}: ${e.message}: ${e?.stack}`);
	}
	if (!module || !module.default) {
		throw new Error(`Module at ${filePath} does not export default`);
	}
	return module.default;
};
