//
// ### Queries
//

import { ExtractFieldEntityName, fragment, query } from './ORM';
import { Database, Role, Todo, User } from './Schema';

// 1. Simple cases,
{
	const allUserNames = query(Database.users(User.name));
	const things = query(Database.users(User.id, User.name));
	const allUserIdsAndNames = query(Database.users(User.id, User.name));

	const roleNamesAndPermissions = query(Database.roles(Role.name, Role.permissions));

	const idAndNameAndLastTodoTitle = query(
		Database.users(
			User.id,
			User.name,
			User.lastTodo(Todo.title, Todo.dependencies(Todo.title, Todo.isDone, Todo.isStarted))
		)
	);
}
// 2. Queries with params.
{
	const firstRoleName = query(Database.roles({ limit: 1 }, Role.name));

	const first20UserIdsAndNames = query(Database.users({ offset: 0, limit: 20 }, User.todos(Todo.title)));
}
// 3. Nested queries
{
	const userNamesWithRolesAndPermissions = query(Database.users(User.name, User.roles(Role.name, Role.permissions)));

	query(Database.users(User.todos(Todo.title)));

	const usersWithDoneTodosWithTheirDependencies = query(
		Database.roles(Role.name),
		Database.users(
			{ offset: 20, limit: 20 },
			User.name,
			User.todos({ isDone: false }, Todo.title, Todo.dependencies(Todo.title, Todo.isStarted))
		)
	);
}
