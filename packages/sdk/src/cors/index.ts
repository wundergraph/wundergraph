import { WunderGraphCorsConfiguration } from '../configure';

const allowAll: WunderGraphCorsConfiguration = {
	allowCredentials: true,
	allowedHeaders: ['*'],
	allowedMethods: ['GET', 'POST'],
	allowedOrigins: ['http://*', 'https://*'],
	exposedHeaders: ['*'],
	maxAge: 120,
};

export default {
	allowAll,
};
