import {
	db_IntFieldUpdateOperationsInput,
} from "./components/generated/models";

export interface TodoOrder {
	id: number;
	order: db_IntFieldUpdateOperationsInput;
}
export interface TodoItemProp {
	todo: any;
	allTodos: any;
	lastItem: boolean;
}