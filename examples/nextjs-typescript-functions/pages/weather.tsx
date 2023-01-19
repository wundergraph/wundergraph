import { useState } from 'react';
import { useQuery } from '../components/generated/nextjs';

const Weather = () => {
	const [countryCode, setCountryCode] = useState('DE');
	const { data } = useQuery({
		operationName: 'combine/weather',
		input: {
			code: countryCode,
		},
	});
	return (
		<div>
			<br />
			<input value={countryCode} onChange={(e) => setCountryCode(e.target.value)}></input>
			<br />
			<br />
			<pre style={{ color: 'white' }}>{JSON.stringify(data?.country)}</pre>
			<pre style={{ color: 'white' }}>{JSON.stringify(data?.weather)}</pre>
		</div>
	);
};

export default Weather;
