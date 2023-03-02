import { useQuery, withWunderGraph } from '../../components/generated/nextjs';

const Functions = () => {
	const { data, error } = useQuery({
		operationName: 'users/get',
		input: {
			id: 1,
		},
	});
	if (error || !data) {
		return (
			<div>
				<pre>{JSON.stringify(error)}</pre>
			</div>
		);
	}
	return (
		<div>
			<h1>User</h1>
			<div>
				<div>id: {data.id}</div>
				<div>name: {data.userName}</div>
				<div>bio: {data?.bio}</div>
			</div>
		</div>
	);
};

export default withWunderGraph(Functions);
