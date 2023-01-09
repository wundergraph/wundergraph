import { useState } from 'react';
import Chat from './Chat';
import LandingPage from './LandingPage';

export default function Main() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [username, setUsername] = useState('');
	const [userId, setUserId] = useState(null);

	const login = (id) => {
		setIsLoggedIn(true);
		setUserId(id);
	};

	return (
		<div className="app">
			{!isLoggedIn ? (
				<LandingPage setUsername={setUsername} login={login} username={username} />
			) : (
				<Chat userId={userId} username={username} />
			)}
		</div>
	);
}
