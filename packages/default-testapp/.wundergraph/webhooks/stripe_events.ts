export default {
	handler: () => {
		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Hello Stripe' }),
		};
	},
};

export const config = {
	method: 'POST',
};
