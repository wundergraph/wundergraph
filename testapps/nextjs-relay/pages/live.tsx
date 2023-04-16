import styles from '../styles/Home.module.css';
import React, { Suspense, useEffect } from 'react';
import { PreloadedQuery, graphql, useQueryLoader, useSubscription } from 'react-relay';
import type { live_IndexQuery as IndexQueryType } from '../__generated__/live_IndexQuery.graphql';
import Weather from '../components/Weather';
import { fetchWunderGraphSSRQuery, usePreloadedQuery } from '../lib/createWunderGraphRelayApp';
import TemperatureDetails from '../components/Temperature';
import { InferGetServerSidePropsType, InferGetStaticPropsType } from 'next';

const IndexQuery = graphql`
	query live_IndexQuery($city: String!) {
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

const SubscriptionCounter = () => {
	useSubscription({
		subscription: graphql`
			subscription live_countdownSubscription {
				ws_countdown(from: 100) {
					countdown
				}
			}
		`,
		variables: {},
	});

	return <div>Subscription running...</div>;
};

export async function getServerSideProps() {
	const relayData = await fetchWunderGraphSSRQuery<IndexQueryType>(IndexQuery, {
		city: 'Berlin',
	});

	return {
		props: relayData,
	};
}

export default function Home({
	// Response data not used since live query requires a query reference instead
	queryResponse,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [queryReference, loadQuery] = useQueryLoader<IndexQueryType>(IndexQuery);

	useEffect(() => {
		loadQuery(
			{
				city: 'Berlin',
			},
			{
				// By default fetchPolicy is 'store-or-network' & since SSR already hydrates the store,
				// no client side network request will be made!
				// fetchPolicy: 'store-or-network',
			}
		);
	}, []);

	return <Suspense fallback="loading...">{queryReference && <LiveWeather weather={queryReference} />};</Suspense>;
}

const LiveWeather = ({ weather }: { weather: PreloadedQuery<IndexQueryType, Record<string, unknown>> }) => {
	const data = usePreloadedQuery(IndexQuery, weather, {
		liveQuery: true,
	});

	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<p>Live Weather data with WunderGraph Live Queries + Relay!</p>
				{data?.weather_getCityByName?.weather?.summary && (
					<Weather weather={data.weather_getCityByName.weather.summary} />
				)}
				{data?.weather_getCityByName?.weather?.temperature && (
					<TemperatureDetails weather={data.weather_getCityByName.weather.temperature} />
				)}
				<SubscriptionCounter />
			</main>
		</div>
	);
};
