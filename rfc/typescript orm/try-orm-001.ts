const tsql = {
	query: (args: any): any => {},
	fragment: (args: any): any => {},
	number: 'number',
	string: 'string',
};

const userAccount = tsql.query({
	operationName: 'UserAccount',
	args: {
		id: tsql.string,
		first: tsql.number,
	},
	query: ({ args: { id, first }, query }) =>
		query.user({ id }, (u) => {
			u.id();
			u.name();
			u.email();
			postsFragment(u, { first });
		}),
});

const postsFragment = tsql.fragment({
	on: 'User',
	args: {
		first: tsql.number,
	},
	fragment: ({ args: { first }, fragment }) =>
		fragment.posts({ first }, (p) => {
			p.id();
			p.title();
			p.content();
		}),
});

const data = await userAccount({
	id: '123',
});

console.log(data.user.id); // 1
console.log(data.user.name); // 'John Doe'
console.log(data.user.posts[0].id); // 1
console.log(data.user.posts[0].title); // 'Hello World'
console.log(data.user.posts[0].content); // 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
