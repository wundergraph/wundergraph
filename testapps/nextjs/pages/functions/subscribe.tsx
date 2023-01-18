import { useSubscription, withWunderGraph } from '../../components/generated/nextjs';

const Functions = () => {
	const { data: one } = useSubscription({
		operationName: 'users/subscribe',
		input: {
			id: '1',
		},
	});
	return (
		<div>
			<h1>User</h1>
			<div>
				<div>id: {one?.id}</div>
				<div>name: {one?.userName}</div>
				<div>bio: {one?.bio}</div>
				<div>time: {one?.time}</div>
			</div>
		</div>
	);
};

export default withWunderGraph(Functions);
