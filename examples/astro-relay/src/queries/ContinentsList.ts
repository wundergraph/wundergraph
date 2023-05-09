import { graphql } from 'relay-runtime';

export const ContinentsList = graphql`
	query ContinentsListQuery {
		countries_continents {
			...ContinentName
			countries {
				...CountryName
			}
		}
	}
`;
