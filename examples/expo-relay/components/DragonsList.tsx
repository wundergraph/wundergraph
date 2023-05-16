import { graphql, loadQuery } from 'react-relay';
import { DragonsListDragonsQuery as DragonsListDragonsQueryType } from '../__relay__generated__/DragonsListDragonsQuery.graphql';
import { Dragon } from './Dragon';
import { getEnvironment, useLiveQuery } from '../lib/wundergraph';
import { View, Text } from 'react-native';

const AppDragonsQuery = graphql`
	query DragonsListDragonsQuery {
		spacex_dragons {
			...Dragons_display_details
		}
	}
`;

const dragonsListQueryReference = loadQuery<DragonsListDragonsQueryType>(getEnvironment(), AppDragonsQuery, {});

export const DragonsList = () => {
	const { data } = useLiveQuery<DragonsListDragonsQueryType>({
		query: AppDragonsQuery,
		queryReference: dragonsListQueryReference,
	});

	return (
		<View>
			<Text>Dragons:</Text>
			{data?.spacex_dragons?.map((dragon, dragonIndex) => {
				if (dragon) return <Dragon key={dragonIndex.toString()} dragon={dragon} />;
				return null;
			})}
		</View>
	);
};
