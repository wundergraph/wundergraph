import { graphql } from 'relay-runtime';

export const CountryNameFragment = graphql`
	fragment CountryName on countries_Country {
		code
		name
	}
`;
