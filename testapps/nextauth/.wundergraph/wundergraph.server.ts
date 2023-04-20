import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		authentication: {
			postAuthentication: async (hook) => {
				console.log(hook);
			},
		},
		queries: {
			Dragons: {
				preResolve: async (props) => {
					console.log(props);
				},
			},
		},
		mutations: {
			SetName: {
				mockResolve: async (hook) => {
					return {
						data: {
							setName: hook.input.name,
						},
					};
				},
			},
		},
	},
}));
