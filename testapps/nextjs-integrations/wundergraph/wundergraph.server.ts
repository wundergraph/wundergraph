import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export class MyContext {
	cleanup() {
		console.log('cleaning up');
	}
	hello() {
		return 'world';
	}
	greet() {
		console.log(`say hello ${this.hello()}`);
	}
}

export default configureWunderGraphServer(() => ({
	context: {
		request: {
			create: async () => new MyContext(),
		},
	},
}));
