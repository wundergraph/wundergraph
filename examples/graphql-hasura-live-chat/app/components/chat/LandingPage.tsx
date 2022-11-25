import { useMutation } from '../../lib/wundergraph';
import { SetStateAction, Dispatch } from 'react';

interface Props {
	setUsername: Dispatch<SetStateAction<string>>;
	username: string;
	login: (id: any) => void;
}

const LandingPage = (props: Props) => {
	const { trigger: addUser, isMutating: loading } = useMutation({ operationName: 'AddUser' });

	const onSubmit = (e) => {
		e.preventDefault();
		if (props.username.match(/^[a-z0-9_-]{3,15}$/g)) {
			addUser({ username: props.username })
				.then((res) => {
					props.login(res.hasura_insert_user_one?.id);
				})
				.catch(() => {
					alert('Please try again with a different username.');
					props.setUsername('');
				});
		} else {
			alert('Invalid username. Spaces and special characters not allowed. Please try again');
			props.setUsername('');
		}
	};

	return (
		<div>
			<form className="flex items-center" onSubmit={onSubmit}>
				<div className="relative w-full">
					<input
						type="text"
						className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						placeholder="Choose a username..."
						value={props.username}
						onChange={(e) => props.setUsername(e.target.value)}
						disabled={loading}
					/>
				</div>
				<button
					type="submit"
					className="inline-flex w-40 items-center py-2.5 px-3 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					disabled={loading || props.username === ''}
				>
					{loading ? 'Loading...' : 'Get Started'}
				</button>
			</form>
		</div>
	);
};

export default LandingPage;
