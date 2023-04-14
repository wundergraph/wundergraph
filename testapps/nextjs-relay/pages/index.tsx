import styles from '../styles/Home.module.css';
import React from 'react';
import { graphql } from 'react-relay';
import type { pages_indexQuery as IndexQueryType } from '../__generated__/pages_indexQuery.graphql';
import Weather from '../components/Weather';
import { fetchWunderGraphSSRQuery } from '../lib/createWunderGraphRelayApp';
import TemperatureDetails from '../components/Temperature';
import { InferGetServerSidePropsType, InferGetStaticPropsType } from 'next';

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

export async function getServerSideProps() {
	const relayData = await fetchWunderGraphSSRQuery<IndexQueryType>(IndexQuery, {
		city: 'Berlin',
	});

	return {
		props: relayData,
	};
}

export default function Home({ queryResponse }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<h1 className={styles.title}>
					Welcome to <a href="https://nextjs.org">Next.js!</a>
				</h1>
				{queryResponse?.weather_getCityByName?.weather?.summary && (
					<Weather weather={queryResponse.weather_getCityByName.weather.summary} />
				)}
				{queryResponse?.weather_getCityByName?.weather?.temperature && (
					<TemperatureDetails weather={queryResponse.weather_getCityByName.weather.temperature} />
				)}
			</main>
		</div>
	);
}
