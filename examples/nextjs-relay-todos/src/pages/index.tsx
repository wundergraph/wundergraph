import { pagesAllTodosQuery } from '@/__relay__generated__/pagesAllTodosQuery.graphql';
import { pagesOnTodoChangesSubscription } from '@/__relay__generated__/pagesOnTodoChangesSubscription.graphql';
import { TodoList } from '@/components/TodoList';
import { Suspense, useEffect } from 'react';
import { PreloadedQuery, graphql, usePreloadedQuery, useQueryLoader, useSubscription } from 'react-relay';

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

const App = ({ queryReference }: { queryReference: PreloadedQuery<pagesAllTodosQuery, Record<string, unknown>> }) => {
	useSubscription<pagesOnTodoChangesSubscription>({ subscription: todoChangesSubscription, variables: {} });

	const data = usePreloadedQuery(allTodosQuery, queryReference);

	return <TodoList todos={data} />;
};

export default function Home() {
	const [queryReference, loadQuery] = useQueryLoader<pagesAllTodosQuery>(allTodosQuery);

	useEffect(() => {
		loadQuery({});
	}, []);

	return <Suspense fallback="loading...">{queryReference && <App queryReference={queryReference} />}</Suspense>;
}
