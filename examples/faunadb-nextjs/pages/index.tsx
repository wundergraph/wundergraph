import { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const Home: NextPage = () => {
	const stores = useQuery.AllStores();
	return (
		<div className={styles.examplesContainer}>
			<h1 className={styles.title}>Hello FaunaDB!</h1>
			<p>
				<code className={styles.code}>{JSON.stringify(stores)}</code>
			</p>
		</div>
	);
};

export default withWunderGraph(Home);
