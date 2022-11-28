import {
	db_IntFieldUpdateOperationsInput,
	EditTodoInput,
	UpdateCompleteTodoInput,
} from "./components/generated/models";

export interface TodoOrder {
	id: number;
	order: db_IntFieldUpdateOperationsInput;
}

export interface TodoItemProp {
	todo: any;
	lastItem: boolean;
	deleteTodo: (id: number) => void;
	updateTitle: (updateTodoTitle: EditTodoInput) => void;
	updateCompleteStatus: (updateCompleteTodoStatus: UpdateCompleteTodoInput) => void;
}
