import { useSubscription } from '../../lib/wundergraph';

function TypingIndicator(props) {
	const { data, isLoading, error } = useSubscription({
		operationName: 'SubscribeToUserTyping',
		input: {
			selfId: props.userId,
		},
	});

	if (isLoading || !data || error) {
		return null;
	}

	return (
		<div>
			{data?.hasura_user_typing?.length === 0 ? ' ' : `${data.hasura_user_typing[0].username} is typing ...`}
		</div>
	);
}

export default TypingIndicator;
