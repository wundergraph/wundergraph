import { useQuery, withWunderGraph } from '../../components/generated/nextjs';

const Users = () => {
	const { data } = useQuery({
		operationName: 'users/get',
		input: {
			id: '1',
		},
	});
	return (
		<div className="min-h-screen flex flex-col items-center justify-center text-white">
			<h1 className="text-2xl md:text-3xl font-bold">Typescript Operations</h1>
			<div className="bg-white text-sm md:text-lg text-black p-6 md:p-12 rounded-lg mt-12">
				<div>ID: {data?.id}</div>
				<div>Name: {data?.name}</div>
				<div>Bio: {data?.bio}</div>
			</div>
		</div>
	);
};

export default withWunderGraph(Users);
