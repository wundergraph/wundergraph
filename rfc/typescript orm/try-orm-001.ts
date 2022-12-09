const tsql = {
	query: (...args: any[]): any => {},
	fragment: (...args: any[]): any => {},
	number: 'number',
	string: 'string',
};

// fragments v1
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

// query v1
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
			postsFragment(u, { first: 10 });
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

// fragments v2
const userPosts = tsql.fragment('User', { first: tsql.number }, ({ first }, { posts }) => ({
	posts: posts({ first }, (p) => ({
		id: p.id(),
		title: p.title(),
		content: p.content(),
	})),
}));

// query v2
const userAccount = tsql.query('UserAccount', { id: tsql.string, first: tsql.number }, ({ id, first }, { user }) => ({
	user: user({ id }, (u) => ({
		id: u.id(),
		name: u.name(),
		email: u.email(),
		...userPosts(u, { first: 10 }),
	})),
}));

const data2 = await userAccount({
	id: '123',
	first: 10,
});

console.log(data2.user.id); // 1
console.log(data2.user.name); // 'John Doe'
console.log(data2.user.posts[0].id); // 1
console.log(data2.user.posts[0].title); // 'Hello World'
console.log(data2.user.posts[0].content); // 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
