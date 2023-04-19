import { createFragmentContainer, graphql } from 'react-relay';
import type { Temperature_Details$data } from '../__generated__/Temperature_Details.graphql';

const TemperatureDetails = ({ weather }: { weather: Temperature_Details$data }) => (
	<div>
		<h1>Temperature</h1>
		<ul>
			min: {weather.min}
			<br />
			max: {weather.max}
			<br />
			actual: {weather.actual}
			<br />
			feelsLike: {weather.feelsLike}
		</ul>
	</div>
);

export default createFragmentContainer(TemperatureDetails, {
	weather: graphql`
		fragment Temperature_Details on weather_Temperature {
			min
			max
			actual
			feelsLike
		}
	`,
});
