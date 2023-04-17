import styles from '../styles/Home.module.css';
import React from 'react';
import { graphql, useSubscription } from 'react-relay';
import type { live_IndexQuery as IndexQueryType } from '../__generated__/live_IndexQuery.graphql';
import Weather from '../components/Weather';
import { fetchWunderGraphSSRQuery, useLiveQuery } from '../lib/createWunderGraphRelayApp';
import TemperatureDetails from '../components/Temperature';
import { InferGetServerSidePropsType } from 'next';

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
	// Response data not used since live query references the relay store directly
	queryResponse,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const { data } = useLiveQuery<IndexQueryType>({
		query: IndexQuery,
		variables: {
			city: 'Berlin',
		},
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
				{/* <SubscriptionCounter /> */}
			</main>
		</div>
	);
}
