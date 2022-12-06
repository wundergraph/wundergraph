import { NextPage } from "next";
import { Fragment } from "react";
import AddTodo from "../components/AddTodo";
import { withWunderGraph } from "../components/generated/nextjs";

import TodoList from "../components/TodoList";

const Home: NextPage = () => {
	return (
		<Fragment>
			<div className="flex flex-col items-center w-full">
				<div className="mt-[10%]">
					<div className="mb-5 w-72">
						<div className="flex items-center flex-end">
							<a href="https://wundergraph.com" target="_blank">
								<img src="/wundergraph.svg" className="h-12" alt="WunderGraph logo" />
							</a>
							<span className="mt-2 ml-2 text-2xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
								WunderGraph
							</span>
						</div>
					</div>
					<AddTodo />
					<div className="mt-2">
						<div className="absolute">
							<TodoList />
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
};

export default withWunderGraph(Home);
