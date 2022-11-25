import ChatWrapper from './ChatWrapper';
import { useInterval } from '../../hooks/useInterval';
import { client } from '../../lib/wundergraph';

function Chat(props) {
	// Every 3 seconds emit an online event
	useInterval(async () => {
		await client.mutate({
			operationName: 'EmitOnlineEvent',
			input: {
				userId: props.userId,
			},
		});
	}, 3000);

	return <ChatWrapper userId={props.userId} username={props.username} />;
}

export default Chat;
