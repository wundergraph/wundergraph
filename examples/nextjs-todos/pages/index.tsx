import { NextPage } from 'next';
import { Fragment } from 'react';
import AddTodo from '../components/AddTodo';
import { withWunderGraph } from '../components/generated/nextjs';

import TodoList from '../components/TodoList';

const Home: NextPage = () => {
	return (
		<Fragment>
			<div className="flex flex-col items-center align-center w-full">
				<div className="mt-[10%]">
					<div className="mb-10 w-72">
						<div className="flex items-center justify-center">
							<a href="https://wundergraph.com" target="_blank">
								<img src="/wundergraph.svg" className="h-8" alt="WunderGraph logo" />
							</a>
							<span className="ml-3 text-3xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent font-semibold">
								WunderTodo
							</span>
						</div>
					</div>
					<AddTodo />
					<div className="mt-4">
						<TodoList />
					</div>
				</div>
			</div>
		</Fragment>
	);
};

export default withWunderGraph(Home);
