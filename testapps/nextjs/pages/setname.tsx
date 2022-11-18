import { useMutation, withWunderGraph } from '../components/generated/nextjs';
import { useState } from 'react';

const SetName = () => {
	const [name, setName] = useState<string>('');
	const { trigger, data } = useMutation({
		operationName: 'SetName',
	});
	return (
		<div>
			<h1>SetName</h1>
			<input value={name} onChange={(e) => setName(e.target.value)} />
			<button onClick={() => trigger({ name })}>setname</button>
			<p>{JSON.stringify(data)}</p>
		</div>
	);
};

export default withWunderGraph(SetName);
