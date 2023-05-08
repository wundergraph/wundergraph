import { useQuery, useAuth, useUser, withWunderGraph } from '../components/generated/nextjs';

const Claims = () => {
	const { login } = useAuth();
	const { data: user } = useUser();
	const helloUser = useQuery({
		operationName: 'HelloUser',
	});
	return (
		<div>
			<h1>Claims</h1>
			<button onClick={() => login('github')}>login</button>
			<p>{JSON.stringify(user)}</p>
			<br />
			<p>{JSON.stringify(helloUser)}</p>
		</div>
	);
};

export default withWunderGraph(Claims);
