import { useMutation, withWunderGraph } from '../components/generated/nextjs';
import { useState } from 'react';

const SetName = () => {
	const [name, setName] = useState<string>('');
	const { mutate, result } = useMutation.SetName();
	return (
		<div>
			<h1>SetName</h1>
			<input value={name} onChange={(e) => setName(e.target.value)} />
			<button onClick={() => mutate({ input: { name } })}>setname</button>
			<p>{JSON.stringify(result)}</p>
		</div>
	);
};

export default withWunderGraph(SetName);
