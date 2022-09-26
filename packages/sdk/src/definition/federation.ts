import { GraphQLSchema } from 'graphql';
import axios, { AxiosRequestConfig } from 'axios';
import { RequestMiddleware } from './index';

export const isFederationService = (schema: GraphQLSchema): boolean => {
	const queryType = schema.getQueryType();
	if (queryType === undefined || queryType === null) {
		return false;
	}
	const fields = queryType.getFields();
	if (fields === undefined) {
		return false;
	}
	return Object.keys(fields).indexOf('_service') !== -1;
};

export const fetchFederationServiceSDL = async (
	url: string,
	requestMiddleware?: RequestMiddleware
): Promise<string> => {
	const data = JSON.stringify({
		query: '{_service{sdl}}',
	});

	let opts: AxiosRequestConfig = {
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	};

	if (requestMiddleware) {
		opts = requestMiddleware(opts);
	}

	const res = await axios.post(url, data, opts);

	return res.data.data._service.sdl;
};
