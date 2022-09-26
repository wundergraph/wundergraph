import { GraphQLSchema } from 'graphql';
import axios from 'axios';

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

export const fetchFederationServiceSDL = async (url: string): Promise<string> => {
	const data = JSON.stringify({
		query: '{_service{sdl}}',
	});
	const res = await axios.post(url, data, {
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	});
	return res.data.data._service.sdl;
};
