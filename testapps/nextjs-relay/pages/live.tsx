import styles from '../styles/Home.module.css';
import React, { Suspense, useEffect } from 'react';
import { PreloadedQuery, graphql, useQueryLoader, useSubscription } from 'react-relay';
import type { live_IndexQuery as IndexQueryType } from '../__generated__/live_IndexQuery.graphql';
import Weather from '../components/Weather';
import { fetchWunderGraphSSRQuery, useLiveQuery } from '../lib/createWunderGraphRelayApp';
import TemperatureDetails from '../components/Temperature';

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

const Home = ({ queryReference }: { queryReference: PreloadedQuery<IndexQueryType, Record<string, unknown>> }) => {
	const { data } = useLiveQuery<IndexQueryType>({
		query: IndexQuery,
		queryReference,
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

export default function Live() {
	const [queryReference, loadQuery] = useQueryLoader<IndexQueryType>(IndexQuery);

	useEffect(() => {
		loadQuery({
			city: 'Berlin',
		});
	}, []);

	return <Suspense>{queryReference && <Home queryReference={queryReference} />}</Suspense>;
}
