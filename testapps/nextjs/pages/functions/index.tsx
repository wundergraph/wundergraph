import { useQuery, withWunderGraph } from '../../components/generated/nextjs';

const Functions = () => {
	const { data: all } = useQuery({
		operationName: 'users/all',
	});
	const { data: one } = useQuery({
		operationName: 'users/get',
		input: {
			id: '1',
		},
	});
	return (
		<div>
			<h1>User</h1>
			<div>
				<div>id: {one?.id}</div>
				<div>name: {one?.name}</div>
				<div>bio: {one?.bio}</div>
				<div>roles: {one?.roles.map((r) => r).join(', ')}</div>
			</div>
			<h2>All</h2>
			{all?.map((user) => (
				<div key={user.id}>
					<div>id: {user.id}</div>
					<div>name: {user.userName}</div>
				</div>
			))}
		</div>
	);
};

export default withWunderGraph(Functions);
