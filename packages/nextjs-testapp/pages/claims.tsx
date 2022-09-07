import { AuthProvider, useQuery, useWunderGraph, withWunderGraph } from '../components/generated/nextjs';
import { useHelloUserQuery } from '../components/generated/react';

const Claims = () => {
	const { login, user } = useWunderGraph();
	const helloUser = useHelloUserQuery();
	return (
		<div>
			<h1>Claims</h1>
			<button onClick={() => login(AuthProvider.auth0)}>login</button>
			<p>{JSON.stringify(user)}</p>
			<br />
			<p>{JSON.stringify(helloUser)}</p>
		</div>
	);
};

export default withWunderGraph(Claims);
