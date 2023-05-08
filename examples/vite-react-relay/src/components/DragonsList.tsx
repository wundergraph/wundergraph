import { graphql, loadQuery } from 'react-relay';
import { getEnvironment, useLiveQuery } from '../lib/wundergraph';
import { Dragon } from './Dragon';
import { DragonsListDragonsQuery as DragonsListDragonsQueryType } from '../__relay__generated__/DragonsListDragonsQuery.graphql';

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
		<div>
			<p>Dragons:</p>
			{data?.spacex_dragons?.map((dragon, dragonIndex) => {
				if (dragon) return <Dragon key={dragonIndex.toString()} dragon={dragon} />;
				return null;
			})}
		</div>
	);
};
