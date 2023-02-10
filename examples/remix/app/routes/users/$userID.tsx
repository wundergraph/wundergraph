import type { LoaderArgs } from '@remix-run/node'; // or cloudflare/deno
import { json } from '@remix-run/node';
import { useCatch, useLoaderData } from '@remix-run/react';
import { client } from 'lib/wundergraph';

export const loader = async ({ params }: LoaderArgs) => {
	const res = await client.query({
		operationName: 'users/get',
		input: {
			id: params.userID!,
		},
	});

	if (res.error) {
		throw json(res.error);
	}

	return res.data;
};

export function CatchBoundary() {
	const caught = useCatch();

	return (
		<div>
			<h1>Error!</h1>
			{JSON.stringify(caught)}
		</div>
	);
}

export default function User() {
	const user = useLoaderData<typeof loader>();

	return (
		<div className="min-h-screen flex flex-col items-center justify-center text-white">
			<h1 className="text-2xl md:text-3xl font-bold">Typescript Operations</h1>
			<div className="bg-white text-sm md:text-lg text-black p-6 md:p-12 rounded-lg mt-12">
				<div>ID: {user?.id}</div>
				<div>Name: {user?.name}</div>
				<div>Bio: {user?.bio}</div>
			</div>
		</div>
	);
}
