import styles from '../styles/Home.module.css';
import React from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import type { RelayProps } from 'relay-nextjs';
import { withRelay } from 'relay-nextjs';
import type { pages_indexQuery as IndexQueryType } from './__generated__/pages_indexQuery.graphql';
import Weather from '../components/Weather';
import { createClientEnvironment } from '@wundergraph/relay-nextjs';
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

function Home({ preloadedQuery }: RelayProps<{}, IndexQueryType>) {
	const data = usePreloadedQuery(IndexQuery, preloadedQuery);
	console.log(data);
	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<h1 className={styles.title}>
					Welcome to <a href="https://nextjs.org">Next.js!</a>
				</h1>
				<Weather weather={data.weather_getCityByName.weather.summary} />
				<TemperatureDetails weather={data.weather_getCityByName.weather.temperature} />
			</main>
		</div>
	);
}

export default withRelay(Home, IndexQuery, {
	createClientEnvironment: () => createClientEnvironment()!,
	createServerEnvironment: async () => {
		const { createServerEnvironment } = await import('@wundergraph/relay-nextjs');
		return createServerEnvironment();
	},
	variablesFromContext: (ctx) => {
		return {
			city: 'Berlin',
		};
	},
});
