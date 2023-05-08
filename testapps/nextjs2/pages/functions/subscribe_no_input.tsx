import { useSubscription, withWunderGraph } from '../../components/generated/nextjs';

const Functions = () => {
	const { data } = useSubscription({
		operationName: 'users/subscribe_no_input',
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
