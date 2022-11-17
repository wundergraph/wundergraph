import React from 'react'
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from './lib/wundergraph';

export default function App() {
	const response = useQuery({
		operationName: 'Dragons'
	})
  return (
    <View style={styles.container}>
			{response.isLoading && <Text>Loading...</Text>}
			{response.data?.spacex_dragons?.map(dragon => (
				<Text key={dragon.name}>{dragon.name}</Text>
			))}
    </View>
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
