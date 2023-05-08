import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const Enums = () => {
	const data = useQuery({
		operationName: 'Test',
		input: {
			input: ['EnumValueA'],
		},
	});
	return (
		<div>
			<h1>Enums</h1>
			<p>{JSON.stringify(data)}</p>
		</div>
	);
};

export default withWunderGraph(Enums);
