import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from './lib/wundergraph';

// React native doesn't fully support URLSearchParams, so we need to polyfill it.
import 'url-search-params-polyfill';

// *experimental, React native doesn't support EventSource (SSE), we need it to run live queries and subscriptions.
// import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
// global.EventSource = NativeEventSource || EventSourcePolyfill;

export default function App() {
	const { data, isLoading } = useQuery({
		operationName: 'Dragons',
	});

	return (
		<View style={styles.container}>
			{isLoading ? (
				<Text>Loading...</Text>
			) : (
				<View>
					{data?.spacex_dragons?.map((dragon) => (
						<View style={styles.dragon} key={dragon.name}>
							<View style={dragon?.active ? styles.active : styles.inactive} />
							<Text key={dragon.name}>{dragon.name} </Text>
						</View>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		color: '#000',
		alignItems: 'center',
		justifyContent: 'center',
	},
	dragon: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 2,
	},
	active: {
		borderRadius: 10,
		width: 10,
		height: 10,
		backgroundColor: 'green',
		marginRight: 4,
	},
	inactive: {
		borderRadius: 10,
		width: 10,
		height: 10,
		backgroundColor: 'gray',
		marginRight: 4,
	},
});
