import { useState } from 'react';
import { UsersUpdateInput } from '../../components/generated/models';
import { useMutation } from '../../lib/react-query';

const Users = () => {
	const [state, setState] = useState<UsersUpdateInput>({
		id: '1',
		name: 'Jens',
		bio: 'Founder of WunderGraph',
	});
	const { data, mutate } = useMutation({
		operationName: 'users/update',
	});
	return (
		<div className="min-h-screen flex flex-col gap-4 items-center justify-center">
			<h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Typescript Operations</h1>
			<input
				className="px-2 py-1 rounded-sm w-64"
				value={state.id}
				onChange={(e) => setState((s) => ({ ...s, id: e.target.value }))}
			/>
			<input
				className="px-2 py-1 rounded-sm w-64"
				value={state.name}
				onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
			/>
			<input
				className="px-2 py-1 rounded-sm w-64"
				value={state.bio}
				onChange={(e) => setState((s) => ({ ...s, bio: e.target.value }))}
			/>
			<button className="bg-blue-500 text-white py-2 px-4 rounded-md" onClick={() => mutate(state)}>
				Update
			</button>
			<pre className="bg-white mt-4">{JSON.stringify(data)}</pre>
		</div>
	);
};

export default Users;
