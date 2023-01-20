import { useState } from 'react';
import { product_updateInput } from '../../components/generated/models';
import { useMutation, withWunderGraph } from '../../components/generated/nextjs';

const Users = () => {
	const [state, setState] = useState<product_updateInput>({
		id: '1',
		name: 'TableTop',
		price: '299',
	});
	const { data, trigger } = useMutation({
		operationName: 'product/update',
	});
	return (
		<div>
			<input value={state.id} onChange={(e) => setState((s) => ({ ...s, id: e.target.value }))}></input>
			<input value={state.name} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}></input>
			<input value={state.price} onChange={(e) => setState((s) => ({ ...s, bio: e.target.value }))}></input>
			<button onClick={() => trigger(state)}>Update</button>
			<pre>{JSON.stringify(data)}</pre>
		</div>
	);
};

export default withWunderGraph(Users);
