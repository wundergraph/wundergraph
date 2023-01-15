import { z } from 'zod';
import * as fs from 'fs';

export type SubscriptionHandler<I, R> = (subscription: { input: I }) => AsyncGenerator<R>;
export type OperationTypes = 'query' | 'mutation' | 'subscription';

export interface BaseOperationConfiguration {
	requireAuthentication?: boolean;
	internal?: boolean;
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
}: {
	input?: I;
	handler: (input: z.infer<I>) => Promise<R>;
	live?: LiveQueryConfig;
} & BaseOperationConfiguration): NodeJSOperation<z.infer<I>, R, 'query'> => {
	return {
		type: 'query',
		inputSchema: input,
		queryHandler: handler,
		internal: internal,
		requireAuthentication: requireAuthentication,
		liveQuery: live,
	};
};

const createMutation = <I extends z.AnyZodObject, R>(
	config: {
		input: I;
		handler: (input: z.infer<I>) => Promise<R>;
	} & BaseOperationConfiguration
): NodeJSOperation<z.infer<I>, R, 'mutation'> => {
	return {
		type: 'mutation',
		inputSchema: config.input,
		mutationHandler: config.handler,
		internal: config.internal,
		requireAuthentication: config.requireAuthentication,
	};
};

const createSubscription = <I extends z.AnyZodObject, R>(
	config: {
		input: I;
		subscribe: SubscriptionHandler<z.infer<I>, R>;
	} & BaseOperationConfiguration
): NodeJSOperation<z.infer<I>, R, 'subscription'> => {
	return {
		type: 'subscription',
		subscriptionHandler: config.subscribe,
		inputSchema: config.input,
		internal: config.internal,
		requireAuthentication: config.requireAuthentication,
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
	queryHandler?: (input: Input) => Promise<Response>;
	mutationHandler?: (input: Input) => Promise<Response>;
	subscriptionHandler?: SubscriptionHandler<Input, Response>;
	requireAuthentication?: boolean;
	internal?: boolean;
	liveQuery?: {
		enable: boolean;
		pollingIntervalSeconds: number;
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

/*
const mySub = createSubscription({
	input: z.object({
		a: z.number(),
	}),
	subscribe: async function* ({input, cancelled}) {
		for (let i = 0; i < 10; i++) {
			yield {b: input.a + i};
		}
	}
});

interface MyOperation {
	input: ExtractInput<typeof mySub>;
	response: ExtractResponse<typeof mySub>;
}

const myOp: MyOperation = {
	input: {
		a: 1,
	},
	response: {
		b: 2
	}
}

const myQuery = createQuery({
	input: z.object({
		a: z.number(),
	}),
	handler: async (input) => {
		return {b: input.a};
	},
	requireAuthentication: true,
})

interface MyQuery {
	input: ExtractInput<typeof myQuery>;
	response: ExtractResponse<typeof myQuery>;
}

const myQuery2: MyQuery = {
	input: {
		a: 1,
	},
	response: {
		b: 1,
	}
}

const myMutation = createMutation({
	input: z.object({
		a: z.number(),
	}),
	handler: async (input) => {
		return {b: input.a};
	},
});

interface MyMutation {
	input: ExtractInput<typeof myMutation>;
	response: ExtractResponse<typeof myMutation>;
}

const myMutation2: MyMutation = {
	input: {
		a: 1,
	},
	response: {
		b: 1,
	}
}
*/
