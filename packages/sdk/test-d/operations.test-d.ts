import { expectType } from 'tsd';
import { ExtractResponse, NodeJSOperation, z } from '../src/operations';

// regular

declare const operation: NodeJSOperation<
	{
		id: string;
		name: string;
		bio: string;
	},
	{
		id: string;
		name: string;
		bio: string;
	},
	unknown,
	'query',
	any,
	any,
	any,
	any,
	any,
	any
>;

type ResponseType = ExtractResponse<typeof operation>;

const response = {
	id: 'string',
	name: 'string',
	bio: 'string',
};

expectType<ResponseType>(response);

// with zod response

const schema = z.object({
	id: z.string(),
	name: z.string(),
	bio: z.string(),
	extraField: z.string(),
});

declare const zodoperation: NodeJSOperation<
	{
		id: string;
		name: string;
		bio: string;
	},
	{
		id: string;
		name: string;
		bio: string;
	},
	typeof schema,
	'query',
	any,
	any,
	any,
	any,
	any,
	any
>;

const zodResponse = {
	id: 'string',
	name: 'string',
	bio: 'string',
	extraField: 'string',
};

type ZodResponseType = ExtractResponse<typeof zodoperation>;

expectType<ZodResponseType>(zodResponse);
