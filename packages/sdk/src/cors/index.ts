import { WunderGraphCorsConfiguration } from '../configure';

const allowAll: WunderGraphCorsConfiguration = {
	allowCredentials: true,
	allowedHeaders: ['*'],
	allowedMethods: ['GET', 'POST'],
	// could not make the allowed origins as '*', because on the client we use credentials: include
	allowedOrigins: ['http://*', 'https://*'],
	exposedHeaders: ['*'],
	maxAge: 120,
};

export default {
	allowAll,
};
