import { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const Home: NextPage = () => {
	const user = useQuery.UserByEmail({
		input: {
			email: 'jens@wundergraph.com',
		},
	});
	return (
		<div className={styles.examplesContainer}>
			<h1 className={styles.title}>Hello WunderGraph!</h1>
			<p>
				<code className={styles.code}>{JSON.stringify(user)}</code>
			</p>
		</div>
	);
};

export default withWunderGraph(Home);
