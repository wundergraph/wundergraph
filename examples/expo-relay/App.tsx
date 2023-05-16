import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { DragonsList } from './components/DragonsList';
import { WunderGraphRelayProvider } from './lib/wundergraph';
import { Suspense } from 'react';

export default function App() {
	return (
		<WunderGraphRelayProvider>
			<Suspense>
				<View style={styles.container}>
					<DragonsList />
				</View>
			</Suspense>
			<StatusBar style="auto" />
		</WunderGraphRelayProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
