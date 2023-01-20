import { useSubscription } from '../../lib/wundergraph';

const SubscribeUsers = () => {
	const { data } = useSubscription({
		operationName: 'users/subscribe',
		input: {
			id: '1',
		},
	});
	return (
		<div style={{ color: 'white' }}>
			<div>{data?.id}</div>
			<div>{data?.name}</div>
			<div>{data?.bio}</div>
			<div>{data?.time}</div>
		</div>
	);
};

export default SubscribeUsers;
