import moment from 'moment';

export default function MessageList(props) {
	return (
		<div className={props.isNew ? 'bg-grey' : 'bg-white'}>
			{props.messages.map((m) => {
				return (
					<div className="flex justify-left w-96">
						<div className="block p-6 rounded-lg w-full shadow-lg">
							<span className="text-gray-900 text-xl leading-tight font-medium mb-2">{m.username}</span>
              &emsp;&emsp;&emsp;
							<i>{moment(m.timestamp).fromNow()} </i>
							<p className="text-gray-700 text-base mb-4">{m.text}</p>
						</div>
					</div>
				);
			})}
			<div style={{ height: 0 }} id="lastMessage"></div>
		</div>
	);
}
