import { withWunderGraph } from '../components/generated/nextjs';
import { useWeatherLiveQuery } from '../components/generated/react';

const StopOnBlur = () => {
	const data = useWeatherLiveQuery({
		forCity: 'Berlin',
	});
	return (
		<div>
			<h1>StopOnBlur</h1>
			<p>{JSON.stringify(data)}</p>
		</div>
	);
};

export default withWunderGraph(StopOnBlur);
