import {z} from 'zod'

const createQuery = <Response, Input>(config: {
	args: z.ZodObject<Input>,
	handler: (args: Input) => Promise<Response>,
}) => ({
	args: config.args,
	handler: config.handler,
})

const userById = createQuery({
	args: z.object({
		userID: z.number().gte(0),
		org: z.number(),
	}),
	handler: async (args) => {

		return {
			userID: '1',
			name: 'John Doe',
			userEmail: 'john@doe.com',
		}
	}
});

interface Queries {
	userByID: {
		args: z.infer<typeof userById.args>
		response: ReturnType<typeof userById.handler>
	},
}

class Client<Queries> {
	public useQuery<Query extends keyof Queries>(query: Query, variables: Queries[Query]['args']): Queries[Query]['response'] {
		return Promise.resolve() as any;
	}
}

const client = new Client<Queries>()

const out = await client.useQuery('userByID', {
	userID: 1,
});

console.log(out.userID);
console.log(out.name);
console.log(out.userEmail);
