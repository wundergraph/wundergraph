const tsql = {
	query: (...args: any[]): any => {},
	fragment: (...args: any[]): any => {},
	number: 'number',
	string: 'string',
};

// fragments
/*
```graphql
fragment UserPosts on User {
	posts(first: $first) {
		id
		title
		content
	}
}
```
*/
const userPosts = tsql
	.fragment('UserPosts', { first: tsql.number })
	.on('User')
	.field('posts', (posts, args) => posts({ first: args.first }).fields('id', 'title', 'content'));

// query
/*
```graphql
query UserAccount($id: String!, $first: Int!) {
	user(id: $id) {
		id
		name
		email
		...UserPosts
	}
}
```
*/
const userAccount = tsql
	.query('UserAccount', { id: tsql.string, first: tsql.number })
	.field('user', (user, args) =>
		user(args.id).fields('id', 'name', 'email').fragment(userPosts, { first: args.first })
	);

const data = await userAccount({
	id: '123',
	first: 10,
});

console.log(data.user.id); // 1
console.log(data.user.name); // 'John Doe'
console.log(data.user.posts[0].id); // 1
console.log(data.user.posts[0].title); // 'Hello World'
console.log(data.user.posts[0].content); // 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
