import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { createClient } from '../.wundergraph/generated/client';
import { createWunderGraphRelayApp } from './lib/wundergraph';

const client = createClient();

const { WunderGraphRelayProvider } = createWunderGraphRelayApp(client);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<WunderGraphRelayProvider>
			<App />
		</WunderGraphRelayProvider>
	</React.StrictMode>
);
