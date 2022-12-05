import './App.css';
import Home from './components/Home';
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import AuthenticatedWeather from './components/AuthenticatedWeather';
import GenerateUsername from './components/GenerateUsername';
import Mocks from './components/Mocks';
function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="authenticate" element={<AuthenticatedWeather />} />
				<Route path="generate-user" element={<GenerateUsername />} />
				<Route path="mocks" element={<Mocks />} />
				<Route path="*" element={<Home />} />
			</Routes>
		</BrowserRouter>
	);
}
export default App;
