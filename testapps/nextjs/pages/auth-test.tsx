import { useQuery, useAuth, useUser, withWunderGraph } from '../components/generated/nextjs';

const Page = () => {
	const weather = useQuery({
		operationName: 'ProtectedWeather',
		input: {
			forCity: 'Berlin',
		},
	});
	const { login, logout } = useAuth();
	const user = useUser();

	return (
		<div>
			<h1>Auth Test</h1>
			<p>This is a test page for the auth component.</p>
			<p>{'user: ' + JSON.stringify(user)}</p>
			<br />
			<button onClick={() => login('github')}>Login</button>
			<br />
			<button onClick={() => logout({ logoutOpenidConnectProvider: true })}>Logout</button>
			<br />
			<p>{JSON.stringify(weather)}</p>
		</div>
	);
};

export default withWunderGraph(Page);
