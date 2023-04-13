import styles from '../styles/Home.module.css';
import React, { useMemo } from 'react';
import { graphql, useSubscription } from 'react-relay';
import type { RelayProps } from 'relay-nextjs';
import type { pages_indexQuery as IndexQueryType } from '../__generated__/pages_indexQuery.graphql';
import Weather from '../components/Weather';
import { withWunderGraphRelay, usePreloadedQuery } from '../lib/createWunderGraphRelayApp';
import TemperatureDetails from '../components/Temperature';

const IndexQuery = graphql`
	query pages_indexQuery($city: String!) {
		weather_getCityByName(name: $city) {
			weather {
				temperature {
					...Temperature_Details
				}
				summary {
					...Weather_Details
				}
			}
		}
	}
`;

// const SubscriptionCounter = () => {
// 	const subscription = useSubscription({
// 		subscription: graphql`
// 			subscription pages_countdownSubscription {
// 				ws_countdown(from: 100) {
// 					countdown
// 				}
// 			}
// 		`,
// 		variables: {},
// 	});

// 	return <div>Subscription running...</div>;
// };

function Home({ preloadedQuery }: RelayProps<{}, IndexQueryType>) {
	const data = usePreloadedQuery(IndexQuery, preloadedQuery, {
		liveQuery: true,
	});

	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<h1 className={styles.title}>
					Welcome to <a href="https://nextjs.org">Next.js!</a>
				</h1>
				{data?.weather_getCityByName?.weather?.summary && (
					<Weather weather={data.weather_getCityByName.weather.summary} />
				)}
				{data?.weather_getCityByName?.weather?.temperature && (
					<TemperatureDetails weather={data.weather_getCityByName.weather.temperature} />
				)}
				{/* <SubscriptionCounter /> */}
			</main>
		</div>
	);
}

export default withWunderGraphRelay(Home, IndexQuery, {
	variablesFromContext: (ctx) => {
		return {
			city: 'Berlin',
		};
	},
});
