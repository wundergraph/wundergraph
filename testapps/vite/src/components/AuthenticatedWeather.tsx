import { useAuth, useUser } from '../lib/wundergraph';
import { useState } from 'react';
import ProtectedLiveWeather from './ProtectedLiveWeather';

const AuthenticatedWeather = () => {
	const user = useUser();
	const { login, logout } = useAuth();
	const [city, setCity] = useState<string>('Berlin');
	const onClick = () => {
		if (!user.data) {
			login('github');
		} else {
			logout();
		}
	};
	return (
		<div className={'examplesContainer'}>
			<h1>Authentication aware Data Fetching</h1>
			<p>
				This Example looks similar to Realtime Subscriptions with one exception, users have to be authenticated to be
				able to use this Operation.
			</p>
			<p>Click the Login Button to login using GitHub. We provide a GitHub demo Oauth2 account for this to work.</p>
			<p>While not logged in, the LiveQuery will reset and wait until the user is logged in.</p>
			<p>Once you logged in, the LiveQuery will start streaming until you de-focus the browser tab or log out.</p>
			<p>
				When you re-focus the tab, the LiveQuery will start streaming again. You can open the DevTools / Network tab to
				observe this.
			</p>
			<p>
				Next, you can try something. First, make sure you're logged in. Then open a second tab and open the same url.
				Log yourself out in the second tab. Then come back to the first tab and see what happens once you focus the tab.
				=)
			</p>
			<p>
				Finally, log in again and go back to the second tab. This is what we call{' '}
				<a
					href="https://wundergraph.com/docs/overview/features/authentication_aware_data_fetching?utm_source=nextjs-starter"
					target="_blank"
				>
					authentication aware data fetching
				</a>
			</p>
			<p>
				You can change the authentication configuration at{' '}
				<code className={'code'}>.wundergraph/wundergraph.operations.ts:34</code>
			</p>
			<p>
				Learn more on how to configure your Operations:{' '}
				<a
					target="_blank"
					href="https://wundergraph.com/docs/reference/wundergraph_operations_ts/overview?utm_source=nextjs-starter"
				>
					Operations Configuration Docs
				</a>
			</p>
			<h2>Login State</h2>
			<div>{user.data ? <p>{JSON.stringify(user)}</p> : <p>Not logged in</p>}</div>
			<button onClick={onClick}>{!user.data ? 'Login' : 'Logout'}</button>
			{user.data && (
				<>
					<h2>Enter City Search</h2>
					<input value={city} onChange={(e) => setCity(e.target.value)} />
					<ProtectedLiveWeather city={city} />
				</>
			)}
		</div>
	);
};
export default AuthenticatedWeather;
