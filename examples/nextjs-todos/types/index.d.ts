import { TodoResponseData } from '../components/generated/models';

export type Todo = Required<TodoResponseData>['todo'];
export type Todos = Required<TodosResponseData>['todos'];
