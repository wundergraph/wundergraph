import { useState } from 'react';
import RenderMessages from './RenderMessages';
import Textbox from './Textbox';
import OnlineUsers from './OnlineUsers';

export default function RenderMessagesProxy(props) {
	const [mutationCallback, setMutationCallback] = useState(null);

	return (
		<div>
			<OnlineUsers />
			<RenderMessages setMutationCallback={setMutationCallback} username={props.username} userId={props.userId} />
			<Textbox username={props.username} mutationCallback={mutationCallback} userId={props.userId} />
		</div>
	);
}
