import { useQuery, useSubscription, withWunderGraph } from '../../components/generated/nextjs';

const Users = () => {
	const { data } = useSubscription({
		operationName: 'incremental/data',
	});
	return (
		<div className="min-h-screen flex flex-col items-center justify-center text-white">
			<h1 className="text-2xl md:text-3xl font-bold">Typescript Operations</h1>
			<div className="bg-white text-sm md:text-lg text-black p-6 md:p-12 rounded-lg mt-12">
				<div>Fast: {JSON.stringify(data?.fast)}</div>
				<div>Slow: {JSON.stringify(data?.slow)}</div>
				<div>List: {JSON.stringify(data?.list)}</div>
			</div>
		</div>
	);
};

export default withWunderGraph(Users);
