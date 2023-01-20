import { useQuery, withWunderGraph } from '../../components/generated/nextjs';

const Users = () => {
	const { data } = useQuery({
		operationName: 'product/get',
		input: {
			id: '1',
		},
	});
	return (
		<div style={{ color: 'white' }}>
			<div>{data?.name}</div>
			<div>{data?.price}</div>
			<div>{data?.weight}</div>
		</div>
	);
};

export default withWunderGraph(Users);
