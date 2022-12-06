import { useRef, useState } from "react";
import useAddMutation from "../hooks/useAddTodoMutation";

const AddTodo = () => {
	const createTodo = useAddMutation();

	const [title, setTitle] = useState<string>("");

	const titleRef = useRef<HTMLInputElement>(null);

	function addTodo() {
		if (title.trim().length > 0) {
			createTodo.trigger({ title });
			clearAdd();
		}
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Escape") {
			clearAdd();
		} else if (event.key === "Enter") {
			addTodo();
		}
	}

	function clearAdd() {
		setTitle("");
	}

	return (
		<div className="relative">
			<input
				ref={titleRef}
				placeholder="Add todo"
				type="text"
				onKeyDown={handleKeyDown}
				value={title}
				onChange={(e) => {
					setTitle(e.target.value);
				}}
				className="bg-gray-600 py-3 pl-5 pr-10 w-72 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
			/>
			<div onClick={addTodo} className="absolute right-1.5 top-3 cursor-pointer hover:bg-zinc-500 hover:rounded">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="white"
					className="w-6 h-6"
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
			</div>
		</div>
	);
};

export default AddTodo;
