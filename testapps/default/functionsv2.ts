import {z} from 'zod'

class Builder<Input, Response> {

	private type: 'query' | 'mutation' | 'subscription' = 'query'
	private inputSchema: z.ZodObject<any> | undefined = undefined
	private _handler: (input: Input) => Promise<Response> | undefined = undefined

	public query() {
		this.type = 'query'
		return this
	}

	public mutation() {
		this.type = 'mutation'
		return this
	}

	public input<I extends any>(input: I) {
		this.inputSchema = input
		return this as Builder<z.infer<I>, Response>
	}

	public handler<R>(handler: (input: Input) => Promise<R>) {
		this._handler = handler;
		return this as Builder<Input, R>
	}

	public build() {
		return {
			type: this.type,
			input: this.inputSchema,
			handler: this._handler
		}
	}
}

type ExtractInput<B> = B extends Builder<infer T, any> ? T : never;
type ExtractResponse<B> = B extends Builder<any, infer T> ? T : never;

const createOperation = <I, R>() => {
	return new Builder<I, R>()
}

const getX =
	createOperation()
		.query()
		.input(z.object({x: z.number().describe('this is x')}))
		.handler(async ({x}) => {
			return {
				data: x,
				xPlusOne: x + 1
			}
		})

const userByID = 
	createOperation()
	.query()
	.input(z.object({userByID: z.string()}).required())
	.handler(async ({userByID}) => {
		return {
			id: userByID,
			name: 'test',
			age: 20,
		}
	})

interface Queries {
	x: {
		args: ExtractInput<typeof getX>,
		response: ExtractResponse<typeof getX>
	},
	userByID: {
		args: ExtractInput<typeof userByID>,
		response: ExtractResponse<typeof userByID>
	}
}

class Client<Queries> {
	public useQuery<Query extends keyof Queries>(query: Query, variables: Queries[Query]['args']): Queries[Query]['response'] {
		return Promise.resolve() as any;
	}
}

const client = new Client<Queries>()

const out = await client.useQuery('x', {
	x: 1
});

console.log(out.data);
console.log(out.xPlusOne);

const out2 = await client.useQuery('userByID', {
	userByID: '1'
});

console.log(out2.id);
console.log(out2.age);
console.log(out2.name);
