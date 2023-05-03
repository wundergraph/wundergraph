import { pagesAllTodosQuery } from '@/__relay__generated__/pagesAllTodosQuery.graphql';
import { pagesOnTodoChangesSubscription } from '@/__relay__generated__/pagesOnTodoChangesSubscription.graphql';
import { TodoList } from '@/components/TodoList';
import { getEnvironment } from '@/lib/wundergraph';
import { graphql, usePreloadedQuery, useSubscription } from 'react-relay';
import { loadQuery } from 'react-relay/hooks';

const allTodosQuery = graphql`
	query pagesAllTodosQuery {
		todos_todos {
			...Todo_todo
		}
	}
`;

const todoChangesSubscription = graphql`
	subscription pagesOnTodoChangesSubscription {
		todos_TodoChanges {
			id
			text
			isCompleted
		}
	}
`;

const loadTodosReference = loadQuery<pagesAllTodosQuery>(getEnvironment(), allTodosQuery, {});

const App = () => {
	useSubscription<pagesOnTodoChangesSubscription>({ subscription: todoChangesSubscription, variables: {} });

	const data = usePreloadedQuery(allTodosQuery, loadTodosReference);

	return (
		<div className="bg-gray-100 min-h-screen py-6">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-4xl font-bold text-center mb-6 text-gray-800">WunderGraph TodoList</h1>
				<TodoList todos={data} />
			</div>
		</div>
	);
};

export default App;
