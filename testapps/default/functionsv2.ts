import { z } from 'zod';
import { Selection, SelectionSet } from '@timkendall/tql';
import { IQuery, ISchema, query, Result, $ } from './orm';
class Builder<Input, Response> {
	private type: 'query' | 'mutation' | 'subscription' = 'query';
	private inputSchema: z.ZodObject<any> | undefined;
	private _handler: (input: Input) => Promise<Response> | undefined;

	public query() {
		this.type = 'query';
		return this;
	}

	public mutation() {
		this.type = 'mutation';
		return this;
	}

	public input<I extends z.AnyZodObject>(input: I) {
		this.inputSchema = input;
		return this as unknown as Builder<z.infer<I>, Response>;
	}

	public handler<R>(handler: (input: Input) => Promise<R>) {
		const builder: Builder<Input, R> = this as unknown as Builder<Input, R>;
		builder._handler = handler;
		return builder;
	}
}

type ExtractInput<B> = B extends Builder<infer T, any> ? T : never;
type ExtractResponse<B> = B extends Builder<any, infer T> ? T : never;

const createOperation = <I, R>() => {
	return new Builder<I, R>();
};

const getX = createOperation()
	.query()
	.input(z.object({ x: z.number().describe('this is x'), y: z.string() }))
	.handler(async ({ x }) => {
		return {
			data: x,
			xPlusOne: x + 1,
		};
	});

// create execute function that extracts variabls via Variables<T> and Response via Result<ISchema, IQuery, SelectionSet<T>>
const execute = <T extends ReadonlyArray<Selection>>(query: T): Promise<Result<ISchema, IQuery, SelectionSet<T>>> => {
	return Promise.resolve({} as Result<ISchema, IQuery, SelectionSet<T>>);
};

const userByID = createOperation()
	.query()
	.input(z.object({ userByID: z.number() }))
	.handler(async ({ userByID }) => {
		const user = await execute(
			query((t) => [t.jsp_getUser({ id: userByID, tld: 'com' }, (u) => [u.id(), u.name(), u.email()])])
		);

		const germany = await execute(
			query((q) => [
				q.countries_countries({ filter: { code: { eq: 'DE' } } }, (c) => [c.code(), c.name(), c.capital()]),
			])
		);

		const posts = await execute(
			query((q) => [
				q.db_findManyPost({ take: 10, where: $('where') }, (p) => [
					p.id(),
					p.User((u) => [
						u.id(),
						//u.email(),
						u.name(),
					]),
				]),
			])
		);

		if (germany.countries_countries.length !== 1) {
			throw new Error('Germany not found');
		}

		const { name, ...userWithoutName } = user.jsp_getUser!;

		return {
			user: {
				...userWithoutName,
				userName: name,
			},
			germany: germany.countries_countries[0],
			posts: posts.db_findManyPost!,
		};
	});

interface Definitions {
	[key: string]: {
		args: any;
		response: any;
	};
}

interface Queries extends Definitions {
	x: {
		args: ExtractInput<typeof getX>;
		response: ExtractResponse<typeof getX>;
	};
	userByID: {
		args: ExtractInput<typeof userByID>;
		response: ExtractResponse<typeof userByID>;
	};
}

class Client<Definitions> {
	public useQuery<Query extends keyof Queries>(
		query: Query,
		variables: Queries[Query]['args']
	): Queries[Query]['response'] {
		return Promise.resolve() as any;
	}
}

const client = new Client<Queries>();

const out = await client.useQuery('x', {
	x: 1,
	y: 'true',
});

console.log(out.data);
console.log(out.xPlusOne);

const out2 = await client.useQuery('userByID', {
	userByID: 1,
});

console.log(out2.user.id);
console.log(out2.user.name);
console.log(out2.user.email);

console.log(out2.germany.capital);

console.log(out2.posts[0].id);
console.log(out2.posts[0].User.id);
console.log(out2.posts[0].User.email);
