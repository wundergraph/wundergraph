import { useQuery } from '../../lib/wundergraph';

const User = () => {
	const { data } = useQuery({
		operationName: 'users/get',
		input: {
			id: '1',
		},
	});
	return (
		<div style={{ color: 'white' }}>
			<div>{data?.id}</div>
			<div>{data?.name}</div>
			<div>{data?.bio}</div>
		</div>
	);
};

export default User;
