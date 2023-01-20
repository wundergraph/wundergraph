import { useQuery, useSubscription, withWunderGraph } from '../../components/generated/nextjs';

const Users = () => {
	const { data } = useSubscription({
		operationName: 'product/subscribe',
		input: {
			id: '1',
		},
	});
	return (
		<div style={{ color: 'white' }}>
			<div>{data?.name}</div>
			<div>{data?.price}</div>
			<div>{data?.weight}</div>
			<div>{data?.time}</div>
		</div>
	);
};

export default withWunderGraph(Users);
