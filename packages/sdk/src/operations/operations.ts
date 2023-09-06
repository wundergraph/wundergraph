import { z } from 'zod';
import * as fs from 'fs';
import type { BaseRequestContext, OperationsClient, WunderGraphUser } from '../server';
import { OperationError } from '../client';
import { LiveQueryConfiguration, QueryCacheConfiguration } from '../configure/operations';
export type { LiveQueryConfiguration, QueryCacheConfiguration } from '../configure/operations';

const disabledLiveQueryConfiguration = {
	enable: false,
	pollingIntervalSeconds: 0,
};

export type SubscriptionHandler<
	Input,
	InferredResponse,
	ZodResponse,
	UserRole extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient,
	TypedORM,
	OpenApiAgentFactory
> = ZodResponse extends z.ZodObject<any>
	? (
			ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
	  ) => AsyncGenerator<z.infer<ZodResponse>>
	: (
			ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
	  ) => AsyncGenerator<InferredResponse>;

export type OperationTypes = 'query' | 'mutation' | 'subscription';

interface _HandlerContext<
	Input,
	Role extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient,
	TypedORM,
	OpenApiAgentFactory
> extends Omit<BaseRequestContext, 'user' | 'operations'> {
	input: Input extends {} ? Input : never;
	user?: WunderGraphUser<Role, CustomClaims>;
	operations: Omit<InternalOperationsClient, 'cancelSubscriptions'>;
	graph: TypedORM;
	openAI: OpenApiAgentFactory;
}

export type HandlerContext<
	Input,
	Role extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient,
	TypedORM,
	OpenApiAgentFactory
> = Input extends z.ZodObject<any>
	? _HandlerContext<z.infer<Input>, Role, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
	: Omit<_HandlerContext<never, Role, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>, 'input'>;

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

const createQuery =
	<
		UserRole extends string,
		CustomClaims extends {},
		InternalOperationsClient extends OperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		TCustomContext
	>() =>
	<Input extends z.ZodObject<any> = any, InferredResponse = unknown, ZodResponse = unknown>({
		input,
		description = '',
		response,
		handler,
		live,
		cache,
		requireAuthentication,
		internal = false,
		rbac,
		errors = [],
	}: {
		input?: Input;
		description?: string;
		errors?: { new (): OperationError }[];
		response?: ZodResponse;
		handler: ZodResponse extends z.ZodObject<any>
			? (
					ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
			  ) => Promise<z.infer<ZodResponse>>
			: (
					ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
			  ) => Promise<InferredResponse>;
		live?: LiveQueryConfiguration;
		cache?: QueryCacheConfiguration;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'query',
		UserRole,
		CustomClaims,
		InternalOperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		TCustomContext
	> => {
		return {
			type: 'query',
			description,
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
			cache,
			liveQuery: {
				enable: live?.enable || true,
				pollingIntervalSeconds: live?.pollingIntervalSeconds || 5,
			},
		};
	};

const createMutation =
	<
		UserRole extends string,
		CustomClaims extends {},
		InternalOperationsClient extends OperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		CustomContext
	>() =>
	<Input extends z.ZodObject<any> = any, InferredResponse = unknown, ZodResponse = unknown>({
		input,
		description = '',
		response,
		handler,
		requireAuthentication,
		internal = false,
		rbac,
		errors = [],
	}: {
		input?: Input;
		description?: string;
		errors?: { new (): OperationError }[];
		response?: ZodResponse;
		handler: ZodResponse extends z.ZodObject<any>
			? (
					ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
			  ) => Promise<z.infer<ZodResponse>>
			: (
					ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
			  ) => Promise<InferredResponse>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'mutation',
		UserRole,
		CustomClaims,
		InternalOperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		CustomContext
	> => {
		return {
			type: 'mutation',
			description,
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
			liveQuery: disabledLiveQueryConfiguration,
		};
	};

const createSubscription =
	<
		UserRole extends string,
		CustomClaims extends {},
		InternalOperationsClient extends OperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		CustomContext
	>() =>
	<Input extends z.ZodObject<any> = any, InferredResponse = unknown, ZodResponse = unknown>({
		input,
		description = '',
		handler,
		response,
		requireAuthentication,
		internal = false,
		rbac,
		errors = [],
	}: {
		input?: Input;
		description?: string;
		errors?: { new (): OperationError }[];
		response?: ZodResponse;
		handler: SubscriptionHandler<
			Input,
			InferredResponse,
			ZodResponse,
			UserRole,
			CustomClaims,
			InternalOperationsClient,
			TypedORM,
			OpenApiAgentFactory
		>;
	} & BaseOperationConfiguration<UserRole>): NodeJSOperation<
		z.infer<Input>,
		InferredResponse,
		ZodResponse,
		'subscription',
		UserRole,
		CustomClaims,
		InternalOperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		CustomContext
	> => {
		return {
			type: 'subscription',
			description,
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
			liveQuery: disabledLiveQueryConfiguration,
		};
	};

export const createOperationFactory = <
	UserRole extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient,
	TypedORM,
	OpenApiAgentFactory,
	CustomContext
>() => ({
	query: createQuery<UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory, CustomContext>(),
	mutation: createMutation<
		UserRole,
		CustomClaims,
		InternalOperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		CustomContext
	>(),
	subscription: createSubscription<
		UserRole,
		CustomClaims,
		InternalOperationsClient,
		TypedORM,
		OpenApiAgentFactory,
		CustomContext
	>(),
});

export type NodeJSOperation<
	Input,
	Response,
	ZodResponse,
	OperationType extends OperationTypes,
	UserRole extends string,
	CustomClaims extends {},
	InternalOperationsClient extends OperationsClient,
	TypedORM,
	OpenApiAgentFactory,
	CustomContext
> = {
	type: OperationType;
	description?: string;
	inputSchema?: z.ZodObject<any>;
	responseSchema?: ZodResponse;
	queryHandler?: ZodResponse extends z.ZodObject<any>
		? (
				ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
		  ) => Promise<z.infer<ZodResponse>>
		: (
				ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
		  ) => Promise<Response>;
	mutationHandler?: ZodResponse extends z.ZodObject<any>
		? (
				ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
		  ) => Promise<z.infer<ZodResponse>>
		: (
				ctx: HandlerContext<Input, UserRole, CustomClaims, InternalOperationsClient, TypedORM, OpenApiAgentFactory>
		  ) => Promise<Response>;
	subscriptionHandler?: SubscriptionHandler<
		Input,
		Response,
		ZodResponse,
		UserRole,
		CustomClaims,
		InternalOperationsClient,
		TypedORM,
		OpenApiAgentFactory
	>;
	errors?: { new (): OperationError }[];
	requireAuthentication?: boolean;
	internal: boolean;
	liveQuery: LiveQueryConfiguration;
	cache?: QueryCacheConfiguration;
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
		throw new Error(`Error loading module at ${filePath}: ${e.message}: ${e?.stack}`);
	}
	if (!module || !module.default) {
		throw new Error(`Module at ${filePath} does not export default`);
	}
	return module.default;
};
