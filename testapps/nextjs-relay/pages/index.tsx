import styles from '../styles/Home.module.css';
import React from 'react';
import { graphql, usePreloadedQuery } from 'react-relay';
import type { RelayProps } from 'relay-nextjs';
import { withRelay } from 'relay-nextjs';
import type { indexPage_indexQuery as IndexQueryType } from '../queries/__generated__/indexPage_indexQuery.graphql';
import Weather from '../components/Weather';
import { getClientEnvironment } from '../lib/relay_client_environment';

const IndexQuery = graphql`
	query pages_indexQuery($city: String!) {
		weather_getCityByName(name: $city) {
			weather {
				temperature {
					actual
					feelsLike
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

	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<h1 className={styles.title}>
					Welcome to <a href="https://nextjs.org">Next.js!</a>
				</h1>
				<Weather weather={data.weather_getCityByName.weather.summary} />
			</main>
		</div>
	);
}

export default withRelay(Home, IndexQuery, {
	createClientEnvironment: () => getClientEnvironment()!,
	createServerEnvironment: async () => {
		const { createServerEnvironment } = await import('../lib/server/relay_server_environment');
		return createServerEnvironment();
	},
	variablesFromContext: (ctx) => {
		return {
			city: 'Berlin',
		};
	},
});
