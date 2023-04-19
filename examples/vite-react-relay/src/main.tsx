import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { WunderGraphRelayProvider } from './lib/wundergraph';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<WunderGraphRelayProvider>
			<App />
		</WunderGraphRelayProvider>
	</React.StrictMode>
);
