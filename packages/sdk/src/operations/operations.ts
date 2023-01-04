import { z } from 'zod';

export type SubscriptionHandler<I, R> = (subscription: { input: I }) => AsyncGenerator<R>;
export type OperationTypes = 'query' | 'mutation' | 'subscription';

export interface BaseOperationConfiguration {
	requireAuthentication?: boolean;
	internal?: boolean;
}

const createQuery = <I extends z.AnyZodObject, R>(
	config: {
		input: I;
		handler: (input: z.infer<I>) => Promise<R>;
	} & BaseOperationConfiguration
): NodeJSOperation<z.infer<I>, R, 'query'> => {
	return {
		type: 'query',
		inputSchema: config.input,
		queryHandler: config.handler,
		internal: config.internal,
		requireAuthentication: config.requireAuthentication,
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
};

export type ExtractInput<B> = B extends NodeJSOperation<infer T, any, any> ? T : never;
export type ExtractResponse<B> = B extends NodeJSOperation<any, infer T, any> ? T : never;

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
