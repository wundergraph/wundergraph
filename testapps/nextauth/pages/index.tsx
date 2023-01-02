import { NextPage } from 'next';
import { signIn, signOut, useSession } from 'next-auth/react';

import { useMutation, useQuery, useUser, withWunderGraph } from '../lib/wundergraph';

const Home: NextPage = () => {
	const { data: session, status } = useSession();

	const dragons = useQuery({
		operationName: 'Dragons',
		enabled: status === 'authenticated',
	});

	const user = useUser({
		enabled: status === 'authenticated',
		// revalidate: true,
	});

	const mutation = useMutation({
		operationName: 'SetName',
	});

	if (session) {
		return (
			<div>
				<p>Signed in as {session.user.email}</p>
				<p>Dragons: {JSON.stringify(dragons.data)}</p>
				<p>User: {JSON.stringify(user.data)}</p>
				<br />
				<button onClick={() => signOut()}>Sign out</button>

				<button
					onClick={() =>
						mutation.trigger({
							name: 'Test',
						})
					}
				>
					Mutate
				</button>

				<code>
					<pre>{JSON.stringify(mutation.data, null, 2)}</pre>
				</code>
			</div>
		);
	}
	return (
		<>
			Not signed in <br />
			<button onClick={() => signIn()}>Sign in</button>
		</>
	);
};

export default withWunderGraph(Home);
