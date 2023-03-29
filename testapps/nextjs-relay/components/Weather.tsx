import { createFragmentContainer, graphql } from 'react-relay';
import type { Weather_Details$data } from './__generated__/Weather_Details.graphql';

const Weather = ({ weather }: { weather: Weather_Details$data }) => (
	<div>
		<h1>Blog posts</h1>
		<ul>
			title: {weather.title}
			<br />
			description: {weather.description}
		</ul>
	</div>
);

export default createFragmentContainer(Weather, {
	weather: graphql`
		fragment Weather_Details on weather_Summary {
			title
			description
		}
	`,
});
