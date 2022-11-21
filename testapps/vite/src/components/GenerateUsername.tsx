import { useMutation } from '../lib/wundergraph';
import React, { FormEvent, useState } from 'react';
import styles from '../../styles/Home.module.css';

const GenerateUsername = () => {
	const { data, trigger } = useMutation({
		operationName: 'SetName',
	});
	const [userName, setUsername] = useState('');

	function generateUserName(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		trigger({
			name: userName,
		});
	}
	return (
		<div>
			<h1>Mutation: Example</h1>
			<p>With WunderGraph, it's very easy to write mutation</p>

			<p>
				To see mutation, look at&nbsp;
				<code className={styles.code}>wundergraph.server.ts:68</code>
			</p>
			<p>
				The use of the method from the clients' perspective can be found at&nbsp;
				<code className={styles.code}>components/GenerateUsername.tsx:6</code>
			</p>
			<p>
				To trigger the mutation from the clients' perspective look at&nbsp;
				<code className={styles.code}>components/GenerateUsername.tsx:11</code>
			</p>

			<h1>Generate a User! </h1>
			{data && <p>Username: {data.gql_setName}</p>}
			<form onSubmit={generateUserName}>
				<input value={userName} onChange={(e) => setUsername(e.target.value)} />
				<br />
				<button type={'submit'}>Generate username</button>
			</form>
		</div>
	);
};
export default GenerateUsername;
