import postmanToOpenApi from 'postman-to-openapi';

import { OpenAPIIntrospectionV2, introspectOpenApiV2 } from './openapi-introspection';

export const introspectPostman = async (introspection: OpenAPIIntrospectionV2) => {
	let result: string;
	switch (introspection.source.kind) {
		case 'file':
			result = await postmanToOpenApi(introspection.source.filePath);
			break;
		case 'object':
			result = await postmanToOpenApi(JSON.stringify(introspection.source.openAPIObject));
			break;
		case 'string':
			result = await postmanToOpenApi(introspection.source.openAPISpec);
			break;
		case 'url':
			const resp = await fetch(introspection.source.url);
			const text = await resp.text();
			result = await postmanToOpenApi(text);
			break;
	}
	const openApiIntrospection: OpenAPIIntrospectionV2 = JSON.parse(JSON.stringify(introspection));
	openApiIntrospection.source = {
		kind: 'string',
		openAPISpec: result,
	};
	return introspectOpenApiV2(openApiIntrospection);
};
