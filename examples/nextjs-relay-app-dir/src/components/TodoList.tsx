'use client';

import { graphql } from 'react-relay';
import { Todo } from './Todo';
import { wunderGraphRelayClientWrapper } from '@/lib/wundergraph/client';

const allTodosQuery = graphql`
	query TodoListAllTodosQuery {
		todos_todos {
			...Todo_todo
		}
	}
`;

const TodoList = ({ todosQueryResponse }) => {
	return todosQueryResponse?.todos_todos?.map((todo, index) => {
		return todo ? <Todo key={index.toString()} data={todo} /> : null;
	});
};

export const TodoListWithWrapper = wunderGraphRelayClientWrapper(TodoList);
