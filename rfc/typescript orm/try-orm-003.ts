type BaseOperation<T extends object> = T & {
	__operation: string;
};

type OperationNames = keyof typeof Operation;
type OperationByName<T> = Extract<Operations, { __operation: T }>;
type OperationParams<T> = Omit<OperationByName<T>, '__operation'>;
type OperationMethods = {
	[T in OperationNames]: (options: { [Property in keyof OperationParams<T>]: OperationParams<T>[Property] }) => Client;
};

type StackItem<T> = OperationByName<T>;
type Stack<T> = StackItem<StackItem<T>>[];

type Client = OperationMethods & {
	stack: Stack<Operations>;
	call: () => Client;
};
// Ignoring the fact that we're using a proxy these methods but want the TS client to be a proxy.
// @ts-ignore
const client: Client = new Proxy(
	{
		stack: [],
		call: () => {
			console.log(client.stack);
			client.stack = [];
			return client;
		},
	},
	{
		get(target, __operation: OperationNames | 'call', proxy) {
			return __operation === 'call'
				? Reflect.get(target, __operation)
				: (options: OperationParams<typeof __operation>) => {
						const stackCall: any = [{ __operation, ...options }];
						Reflect.set(target, 'stack', target.stack.concat(stackCall));
						return proxy;
				  };
		},
	}
);

/**
 * Generated Types Below
 */
enum Operation {
	weather_getCityByName,
	weather_getByZip,
}

type weatherGetCityByName = BaseOperation<{
	__operation: 'weather_getCityByName';
	someParam: boolean;
	otherParam: String;
}>;

type weatherGetByZip = BaseOperation<{
	__operation: 'weather_getByZip';
	anotherParam: number;
}>;

type Operations = weatherGetCityByName | weatherGetByZip;
/**
 * End Generated Types
 */

// EXAMPLE USE
client
	.weather_getByZip({ anotherParam: 1 })
	.weather_getCityByName({ someParam: true, otherParam: 'test' })
	.call()
	.weather_getByZip({ anotherParam: 2 })
	.call();
