import { useFragment, graphql } from 'react-relay';
import { FC } from 'react';
import { Dragons_display_details$key } from '../__relay__generated__/Dragons_display_details.graphql';

export interface DragonsProps {
	dragon: Dragons_display_details$key;
}

const AllDragonsFragment = graphql`
	fragment Dragons_display_details on spacex_Dragon {
		name
		active
	}
`;

export const Dragon: FC<DragonsProps> = ({ dragon }) => {
	const data = useFragment(AllDragonsFragment, dragon);
	return (
		<div>
			<p>Dragon Name: {data.name}</p>
			<span>
				status: <i>{data.active ? 'active' : 'retired'}</i>
			</span>
		</div>
	);
};
