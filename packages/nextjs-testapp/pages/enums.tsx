import { withWunderGraph } from '../components/generated/nextjs';
import { useTestQuery } from '../components/generated/react';

const Enums = () => {
	const data = useTestQuery({
		input: ['EnumValueA'],
	});
	return (
		<div>
			<h1>Enums</h1>
			<p>{JSON.stringify(data)}</p>
		</div>
	);
};

export default withWunderGraph(Enums);
