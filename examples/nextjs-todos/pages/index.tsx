import {Reorder} from "framer-motion";
import {NextPage} from "next";
import React, {Fragment, useRef, useState} from "react";
import {useSWRConfig} from "swr";
import {useQuery, withWunderGraph} from "../components/generated/nextjs";
import TodoItem from "../components/TodoItem";

import useAddMutation from "../hooks/useAddTodoMutation";
import useReorderTodoMutation from "../hooks/useReorderTodoMutation";


const Home: NextPage = () => {
    const {mutate} = useSWRConfig();
    const allTodos = useQuery({
        operationName: "Todos",
        onSuccess: (data) => {
            setOldTodos(data.db_findManyTodo);
        }
    });
    const reorderTodos = useReorderTodoMutation();
    const createTodo = useAddMutation();

    const [oldTodos, setOldTodos] = useState([]);
    const [title, setTitle] = useState<string>("");
    const titleRef = useRef<HTMLInputElement>();

    /*
    * Only a single pair of adjacent items are swapped at any given reorder
    * */
    function handleReorder(newOrder: number[]) {
        let newItems = [...allTodos.data.db_findManyTodo];
        for (let i = 0; i < newOrder.length - 1; i++) {
            if (newOrder[i] < newOrder[i + 1]) {
                let temp = newItems[i];
                newItems[i] = newItems[i + 1];
                newItems[i + 1] = temp;
                break;
            }
        }
        let updatedReorder = {db_findManyTodo: newItems};
        mutate(
            {operationName: "Todos"},
            async () => {
                return {db_findManyTodo: newItems};
            },
            {optimisticData: updatedReorder, revalidate: false, rollbackOnError: true}
        );
    }

    /*
    * item: the item being dragged
    * index: the index of the item after the drag
    * */
    async function reorderItems(item: any, index: number) {
        let newOrder: number = oldTodos[index].order;
        let oldOrder = item.order;
        //make sure drag happened
        if (newOrder != oldOrder) {
            let id = item.id;
            await reorderTodos({id, newOrder, oldOrder, allTodos});
        }
    }

    async function addTodo() {
        if (title.trim().length > 0) {
            await createTodo({title, allTodos});
            clearAdd();
        }
    }

    async function titleKeyHandler(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape") {
            clearAdd();
        } else if (event.key === "Enter") {
            await addTodo();
        }
    }

    function clearAdd() {
        setTitle("");
        titleRef.current.blur();
    }

    return (
        <Fragment>
            <div className="flex flex-col items-center w-full">
                <div className="mt-[10%]">
                    <div className="mb-5 w-72">
                        <div className="flex items-center flex-end">
                            <a href="https://wundergraph.com" target="_blank">
                                <img src="/wundergraph.svg" className="h-12" alt="WunderGraph logo"/>
                            </a>
                            <span
                                className="mt-2 ml-2 text-2xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
								WunderGraph
							</span>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            ref={titleRef}
                            placeholder="Add todo"
                            type="text"
                            onKeyDown={titleKeyHandler}
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                            }}
                            className="bg-gray-600 py-3 pl-5 pr-10 w-72 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
                        />
                        <div onClick={addTodo}
                             className="absolute right-1.5 top-3 cursor-pointer hover:bg-zinc-500 hover:rounded">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="white"
                                className="w-6 h-6"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="absolute mt-1 -ml-1">
                            {allTodos.data?.db_findManyTodo && (
                                <Reorder.Group
                                    axis="y"
                                    values={allTodos.data.db_findManyTodo.map((c) => c.order)}
                                    onReorder={handleReorder}
                                >
                                    {allTodos.data.db_findManyTodo.map((todo, index: number) => (
                                        <Reorder.Item
                                            onDragEnd={() => {
                                                reorderItems(todo, index);
                                            }}
                                            key={todo.id}
                                            value={todo.order}>
                                            <TodoItem
                                                todo={todo}
                                                allTodos={allTodos}
                                                lastItem={index === allTodos.data.db_findManyTodo.length - 1}
                                            />
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};
export default withWunderGraph(Home);
