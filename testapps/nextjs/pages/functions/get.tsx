import { useQuery, withWunderGraph } from '../../components/generated/nextjs';

const Functions = () => {
	const { data: one } = useQuery({
		operationName: 'users/get',
		input: {
			id: 1,
		},
	});
	return (
		<div>
			<h1>User</h1>
			<div>
				<div>id: {one?.id}</div>
				<div>name: {one?.userName}</div>
				<div>bio: {one?.bio}</div>
				<pre>{JSON.stringify(one?.weather)}</pre>
			</div>
		</div>
	);
};

export default withWunderGraph(Functions);
