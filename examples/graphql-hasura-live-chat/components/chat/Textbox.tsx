import { useState } from 'react';
import TypingIndicator from './TypingIndicator';
import { client, useMutation } from '../../lib/wundergraph';

export default function Textbox(props) {
	const [text, setText] = useState('');

	const { trigger: insertMessage } = useMutation({
		operationName: 'InsertMessage',
	});

	const handleTyping = (text) => {
		const textLength = text.length;
		if ((textLength !== 0 && textLength % 5 === 0) || textLength === 1) {
			emitTypingEvent();
		}
		setText(text);
	};

	const emitTypingEvent = async () => {
		if (props.userId) {
			await client.mutate({
				operationName: 'EmitTypingEvent',
				input: {
					userId: props.userId,
				},
			});
		}
	};
	const sendMessage = (e) => {
		e.preventDefault();
		if (text === '') {
			return;
		}
		insertMessage({
			message: {
				username: props.username,
				text: text,
			},
		}).then((data) => {
			props.mutationCallback({
				id: data.hasura_insert_message_one.id,
				timestamp: data.hasura_insert_message_one.timestamp,
				username: data.hasura_insert_message_one.username,
				text: data.hasura_insert_message_one.text,
			});
		});
		setText('');
	};

	return (
		<div>
			<form className="flex items-center" onSubmit={sendMessage}>
				<div className="relative w-full">
					<TypingIndicator userId={props.userId} />
					<input
						type="text"
						className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						value={text}
						autoFocus={true}
						onChange={(e) => {
							handleTyping(e.target.value);
						}}
						autoComplete="off"
					/>
				</div>
				<button
					type="submit"
					className="inline-flex w-40 items-center py-2.5 px-3 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Send
				</button>
			</form>
		</div>
	);
}
