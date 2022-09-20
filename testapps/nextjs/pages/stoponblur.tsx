import { useLiveQuery, withWunderGraph } from '../components/generated/nextjs';

const StopOnBlur = () => {
	const data = useLiveQuery.Weather({
		input: {
			forCity: 'Berlin',
		},
	});
	return (
		<div>
			<h1>StopOnBlur</h1>
			<p>{JSON.stringify(data)}</p>
		</div>
	);
};

export default withWunderGraph(StopOnBlur);
