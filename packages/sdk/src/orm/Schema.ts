import { BaseEntity, Model, Union } from './ORM';

//
// ### Schema
//

export interface User extends BaseEntity<'User'> {
	id: string;
	name: string;
	lastTodo: Todo;
	bookmarks: Union<[User, Role]>;
	roles(params: { offset?: number; limit?: number }): Role[];
	todos(params: { offset?: number; limit?: number; isDone?: boolean }): Todo[];
}
export declare const User: Model<User>;

export interface Role extends BaseEntity<'Role'> {
	name: string;
	permissions: string[];
}
export declare const Role: Model<Role>;

export interface Todo extends BaseEntity<'Todo'> {
	title: string;
	isDone: boolean;
	isStarted: boolean;
	dependencies: readonly Todo[];
}
export declare const Todo: Model<Todo>;

export interface Database extends BaseEntity<'#'> {
	admin: User;
	users(params: { offset?: number; limit?: number }): User[];
	roles(params: { offset?: number; limit?: number }): Role[];
}
export declare const Database: Model<Database>;
