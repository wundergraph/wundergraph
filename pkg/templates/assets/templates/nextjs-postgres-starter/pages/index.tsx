import { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const Home: NextPage = () => {
	const hello = useQuery.Hello();
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Hello WunderGraph!</h1>
			<p>
				<code>{JSON.stringify(hello)}</code>
			</p>
		</div>
	);
};

export default withWunderGraph(Home);
