import relayLogo from './assets/relay.svg';
import wundergraphLogo from './assets/wundergraph.png';
import viteLogo from '/vite.svg';
import './App.css';
import { DragonsList } from './components/DragonsList';

function App() {
	return (
		<div className="App">
			<div>
				<a href="https://wundergraph.com" target="_blank">
					<img src={wundergraphLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://vitejs.dev" target="_blank">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://relay.dev/" target="_blank">
					<img src={relayLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>WunderGraph + Vite + Relay</h1>
			<DragonsList />
		</div>
	);
}

export default App;
