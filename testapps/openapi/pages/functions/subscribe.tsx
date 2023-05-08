import { useSubscription, withWunderGraph } from '../../components/generated/nextjs';

const Functions = () => {
	const { data } = useSubscription({
		operationName: 'users/subscribe_without_schema',
		input: {
			id: '1',
		},
	});
	return (
		<div>
			<h1>User</h1>
			<div>
				<div>data: {JSON.stringify(data?.bio)}</div>
			</div>
		</div>
	);
};

export default withWunderGraph(Functions);
