import { NextPage } from 'next';
import styles from '../../styles/Home.module.css';
import { useQuery } from '../../lib/react-query';

const JobsPage: NextPage = () => {
	const launches = useQuery({
		operationName: 'PastLaunches',
	});
	return (
		<div className={styles.examplesContainer}>
			<h1>Cached SpaceX rocket launches</h1>
			<p>
				Have a look at the Network Tab / Devtools, the response is cached up to 120 seconds whereas after 60 seconds,
				the Browser cache will be invalidated through stale while revalidate.
			</p>
			<p>
				Cache- & revalidation timing can be edited in{' '}
				<code className={styles.code}>.wundergraph/wundergraph.operations.ts:36</code>
			</p>
			<p>
				Caching is enabled in <code className={styles.code}>.wundergraph/wundergraph.operations.ts:55</code>
			</p>
			<p>
				The use of the generated client can be found at <code className={styles.code}>pages/caching.tsx:6</code>
			</p>
			<p>
				Additionally, if you re-focus the Browser window/tab you'll see a network request kick off to refresh the page.
			</p>
			<ul>
				{launches.data?.spacex_launchesPast?.map((launch, i) => (
					<li key={i}>
						<h3>{launch.mission_name}</h3>
						<p>{launch.rocket?.rocket_name}</p>
						<p>{launch.launch_site?.site_name_long}</p>
						<a target="_blank" href={launch.links?.article_link}>
							Article
						</a>
						&nbsp;&nbsp;
						<a target="_blank" href={launch.links?.video_link}>
							Video
						</a>
					</li>
				))}
			</ul>
		</div>
	);
};

export default JobsPage;
