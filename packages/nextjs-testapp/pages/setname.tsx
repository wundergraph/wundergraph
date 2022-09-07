import { useMutation, withWunderGraph } from '../components/generated/nextjs';
import { useState } from 'react';
import { useSetNameMutation } from '../components/generated/react';

const SetName = () => {
	const [name, setName] = useState<string>('');
	const { mutate, data } = useSetNameMutation();
	return (
		<div>
			<h1>SetName</h1>
			<input value={name} onChange={(e) => setName(e.target.value)} />
			<button onClick={() => mutate({ name })}>setname</button>
			<p>{JSON.stringify(data)}</p>
		</div>
	);
};

export default withWunderGraph(SetName);
