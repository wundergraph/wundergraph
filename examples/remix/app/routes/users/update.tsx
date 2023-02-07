import { ActionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { createClientFromCookies, useAuth, useUser } from 'lib/wundergraph';

export const action = async ({ request }: ActionArgs) => {
	const client = createClientFromCookies(request);

	const formData = await request.formData();

	const id = formData.get('id')?.toString() ?? '';
	const name = formData.get('name')?.toString() ?? '';
	const bio = formData.get('bio')?.toString() ?? '';

	const result = await client.mutate({
		operationName: 'users/update',
		input: {
			id,
			name,
			bio,
		},
	});

	return result;
};

export default function User() {
	const result = useActionData<typeof action>();
	const { login, logout } = useAuth();
	const { data: user } = useUser();

	return (
		<div className="min-h-screen flex flex-col items-center justify-center">
			<h1 className="text-2xl md:text-3xl font-bold text-white">Update User</h1>

			<button
				type="button"
				onClick={() => {
					!user ? login('github') : logout();
				}}
				className="border border-gray-500 text-white py-2 px-2 rounded-md text-xs mt-2"
			>
				{!user ? 'Login to update user' : 'Logout'}
			</button>

			{user && (
				<>
					<Form method="post" className="flex flex-col gap-4 mt-8">
						<input placeholder="id" className="px-2 py-1 rounded-sm w-64" name="id" type="text" />
						<input placeholder="name" className="px-2 py-1 rounded-sm w-64" name="name" type="text" />
						<input placeholder="bio" className="px-2 py-1 rounded-sm w-64" name="bio" type="text" />
						<button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md">
							Update
						</button>
					</Form>
				</>
			)}

			<pre className="bg-white mt-4">{JSON.stringify(result?.error)}</pre>
			<pre className="bg-white mt-4">{JSON.stringify(result?.data)}</pre>
		</div>
	);
}
