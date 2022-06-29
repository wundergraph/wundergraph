import { AuthProvider, useWunderGraph, withWunderGraph } from '../components/generated/nextjs';

const Page = () => {
	const { user, login, logout } = useWunderGraph();
	return (
		<div>
			<h1>Auth Test</h1>
			<p>This is a test page for the auth component.</p>
			<p>{'user: ' + JSON.stringify(user)}</p>
			<br />
			<button onClick={() => login(AuthProvider.github)}>Login</button>
			<br />
			<button onClick={() => logout()}>Logout</button>
		</div>
	);
};

export default withWunderGraph(Page);
