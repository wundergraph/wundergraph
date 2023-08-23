import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import config from './wundergraph.config';

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
	integrations: config.integrations,
	context: {
		request: {
			create: async () => new MyContext(),
		},
	},
}));
