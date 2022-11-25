import { useState } from 'react';
import { useSubscription } from '../../lib/wundergraph';

function OnlineUsers() {
	const { data } = useSubscription({ operationName: 'SubscribeToOnlineUsers' });
	const count = !data?.hasura_user_online ? 0 : data?.hasura_user_online.length;

	return (
		<div className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
			<h5 className="mb-2 text-lg font-bold tracking-tight text-gray-900 dark:text-white">Online Users ({count})</h5>
			<p className="font-normal text-gray-700 dark:text-gray-400">
				<ul>
					{data?.hasura_user_online.map((u) => {
						return <li key={u.id}>{u.username}</li>;
					})}
				</ul>
			</p>
		</div>
	);
}

export default OnlineUsers;
