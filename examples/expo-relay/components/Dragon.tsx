import { useFragment, graphql } from 'react-relay';
import { Dragons_display_details$key } from '../__relay__generated__/Dragons_display_details.graphql';
import { FC } from 'react';
import { View, Text } from 'react-native';

const AllDragonsFragment = graphql`
	fragment Dragons_display_details on spacex_Dragon {
		name
		active
	}
`;

export interface DragonsProps {
	dragon: Dragons_display_details$key;
}

export const Dragon: FC<DragonsProps> = ({ dragon }) => {
	const data = useFragment(AllDragonsFragment, dragon);
	return (
		<View>
			<Text>Dragon Name: {data.name}</Text>
			<Text>status: {data.active ? 'active' : 'retired'}</Text>
		</View>
	);
};
