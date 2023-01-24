import { useQuery, withWunderGraph } from '../../components/generated/nextjs';

const Product = () => {
	const { data } = useQuery({
		operationName: 'product/get',
		input: {
			id: '1',
		},
	});
	return (
		<div className="min-h-screen flex flex-col items-center justify-center text-white">
			<h1 className="text-2xl md:text-3xl font-bold">Typescript Operations</h1>
			<div className="bg-white text-sm md:text-lg text-black p-6 md:p-12 rounded-lg mt-12">
				<div>Name: {data?.name}</div>
				<div>Price: {data?.price}</div>
				<div>Weight: {data?.weight}</div>
			</div>
		</div>
	);
};

export default withWunderGraph(Product);
