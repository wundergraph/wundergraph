import { AuthProvider, useQuery, useWunderGraph, withWunderGraph } from '../components/generated/nextjs';

const Page = () => {
	const weather = useQuery.ProtectedWeather({
		input: {
			forCity: 'Berlin',
		},
	});
	const { user, login, logout } = useWunderGraph();
	return (
		<div>
			<h1>Auth Test</h1>
			<p>This is a test page for the auth component.</p>
			<p>{'user: ' + JSON.stringify(user)}</p>
			<br />
			<button onClick={() => login(AuthProvider.auth0)}>Login</button>
			<br />
			<button onClick={() => logout()}>Logout</button>
			<br />
			<p>{JSON.stringify(weather)}</p>
		</div>
	);
};

export default withWunderGraph(Page);
