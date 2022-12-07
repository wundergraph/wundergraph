import { FC } from 'react';
import { useQuery } from '../lib/wundergraph';

const ProtectedLiveWeather: FC<{ city: string }> = ({ city }) => {
	const liveWeather = useQuery({
		operationName: 'ProtectedWeather',
		input: { forCity: city },
		liveQuery: true,
	});
	return (
		<div>
			{liveWeather.isLoading && <p>Loading...</p>}
			{liveWeather.error && <p>Error</p>}
			{liveWeather.data && (
				<div>
					<h3>City: {liveWeather.data.getCityByName?.name}</h3>
					<p>{JSON.stringify(liveWeather.data.getCityByName?.coord)}</p>
					<h3>Temperature</h3>
					<p>{JSON.stringify(liveWeather.data.getCityByName?.weather?.temperature)}</p>
					<h3>Wind</h3>
					<p>{JSON.stringify(liveWeather.data.getCityByName?.weather?.wind)}</p>
				</div>
			)}
		</div>
	);
};
export default ProtectedLiveWeather;
