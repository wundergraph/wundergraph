import { NextPage } from 'next';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';
import styles from '../styles/Home.module.css';

const Mocks: NextPage = () => {
	const weather = useQuery({
		operationName: 'FakeWeather',
	});
	return (
		<div>
			<h1>Mocks: Fake Weather</h1>
			<p>With WunderGraph, it's very easy to create typesafe mocks.</p>
			<p>
				For each Operation you define, the code generator automatically generates all the models and scaffolds a config
				object to create typesafe mocks.
			</p>
			<p>All you have to do is implement a function that returns a mock object.</p>
			<p>
				You can define complex logic if you want, or use an in memory data structure or even a database if you want
				stateful mocks.
			</p>
			<p>
				To modify the mock, look at&nbsp;
				<code className={styles.code}>wundergraph.server.ts:6</code>
			</p>
			<p>
				The use of the method from the clients' perspective can be found at&nbsp;
				<code className={styles.code}>pages/mocks.ts:6</code>
			</p>
			<p>Try changing the implementation and update the UI.</p>
			<p>
				Learn more about Mocking:{' '}
				<a
					href="https://wundergraph.com/docs/reference/wundergraph_config_ts/configure_mocks?utm_source=nextjs-starter"
					target="_blank"
				>
					Mocking Documentation
				</a>
			</p>
			<h2>Response</h2>
			<p>{JSON.stringify(weather)}</p>
		</div>
	);
};

export default withWunderGraph(Mocks);
