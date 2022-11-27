function NavBar() {
	return (
		<nav className="px-2 py-2.5 sm:px-4 bg-gray-900 border-solid border-0 border-b border-zinc-700">
			<div>
				<div className="flex items-center px-5 py-2">
					<a href="https://wundergraph.com" target="_blank">
						<img src="/wundergraph.svg" className="h-12 pr-3" alt="WunderGraph logo" />
					</a>
					<span className="self-center text-xl font-semibold whitespace-nowrap bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
						WunderGraph
					</span>
				</div>
			</div>
		</nav>
	);
}

export default NavBar;
