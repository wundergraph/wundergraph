import { useState } from 'react';
import { ProductUpdateInput } from '../../components/generated/models';
import { useMutation, withWunderGraph } from '../../components/generated/nextjs';

const Users = () => {
	const [state, setState] = useState<ProductUpdateInput>({
		id: '1',
		name: 'TableTop',
		price: '299',
	});
	const { data, trigger } = useMutation({
		operationName: 'product/update',
	});
	return (
		<div className="min-h-screen flex flex-col gap-4 items-center justify-center">
			<h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Typescript Operations</h1>
			<input
				className="px-2 py-1 rounded-sm w-64"
				value={state.id}
				onChange={(e) => setState((s: ProductUpdateInput) => ({ ...s, id: e.target.value }))}
			/>
			<input
				className="px-2 py-1 rounded-sm w-64"
				value={state.name}
				onChange={(e) => setState((s: ProductUpdateInput) => ({ ...s, name: e.target.value }))}
			/>
			<input
				className="px-2 py-1 rounded-sm w-64"
				value={state.price}
				onChange={(e) => setState((s: ProductUpdateInput) => ({ ...s, bio: e.target.value }))}
			/>
			<button className="bg-blue-500 text-white py-2 px-4 rounded-md" onClick={() => trigger(state)}>
				Update
			</button>
			<pre className="bg-white mt-4">{JSON.stringify(data)}</pre>
		</div>
	);
};

export default withWunderGraph(Users);
