import { useMutation, withWunderGraph } from '../../components/generated/nextjs';
import { useState } from 'react';
import { UsersMutateInput } from '../../components/generated/models';

const Functions = () => {
	const [input, setInput] = useState<UsersMutateInput>({ id: '1', name: 'Jens', bio: 'Founder of WunderGraph' });
	const { trigger, data, error } = useMutation({
		operationName: 'users/mutate',
	});
	return (
		<div>
			<h1>User</h1>
			<div>
				<input type="text" value={input.id} onChange={(e) => setInput({ ...input, id: e.target.value })} />
				<input type="text" value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} />
				<input type="text" value={input.bio} onChange={(e) => setInput({ ...input, bio: e.target.value })} />
				<button
					onClick={() => {
						trigger(input);
					}}
				>
					Mutate
				</button>
			</div>
			{data && <pre>{JSON.stringify(data, null, 2)}</pre>}
			{error && <pre>{JSON.stringify(error, null, 2)}</pre>}
		</div>
	);
};

export default withWunderGraph(Functions);
