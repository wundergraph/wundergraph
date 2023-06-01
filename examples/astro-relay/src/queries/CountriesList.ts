import { graphql } from 'relay-runtime';

export const CountriesList = graphql`
	query CountriesListQuery {
		countries_countries {
			...CountryName
		}
	}
`;
