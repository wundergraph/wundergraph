import { graphql } from 'relay-runtime';

export const ContinentNameFragment = graphql`
	fragment ContinentName on countries_Continent {
		code
		name
	}
`;
