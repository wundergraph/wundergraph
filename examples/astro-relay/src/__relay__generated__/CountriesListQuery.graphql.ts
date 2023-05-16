/**
 * @generated SignedSource<<a7d7c025f54b46cae92d16fe818a59a7>>
 * @relayHash 748a312cee04c08e4706dd20f73d9fcf
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 748a312cee04c08e4706dd20f73d9fcf

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type CountriesListQuery$variables = {};
export type CountriesListQuery$data = {
	readonly countries_countries: ReadonlyArray<{
		readonly ' $fragmentSpreads': FragmentRefs<'CountryName'>;
	}>;
};
export type CountriesListQuery = {
	response: CountriesListQuery$data;
	variables: CountriesListQuery$variables;
};

const node: ConcreteRequest = {
	fragment: {
		argumentDefinitions: [],
		kind: 'Fragment',
		metadata: null,
		name: 'CountriesListQuery',
		selections: [
			{
				alias: null,
				args: null,
				concreteType: 'countries_Country',
				kind: 'LinkedField',
				name: 'countries_countries',
				plural: true,
				selections: [
					{
						args: null,
						kind: 'FragmentSpread',
						name: 'CountryName',
					},
				],
				storageKey: null,
			},
		],
		type: 'Query',
		abstractKey: null,
	},
	kind: 'Request',
	operation: {
		argumentDefinitions: [],
		kind: 'Operation',
		name: 'CountriesListQuery',
		selections: [
			{
				alias: null,
				args: null,
				concreteType: 'countries_Country',
				kind: 'LinkedField',
				name: 'countries_countries',
				plural: true,
				selections: [
					{
						alias: null,
						args: null,
						kind: 'ScalarField',
						name: 'code',
						storageKey: null,
					},
					{
						alias: null,
						args: null,
						kind: 'ScalarField',
						name: 'name',
						storageKey: null,
					},
				],
				storageKey: null,
			},
		],
	},
	params: {
		id: '748a312cee04c08e4706dd20f73d9fcf',
		metadata: {},
		name: 'CountriesListQuery',
		operationKind: 'query',
		text: null,
	},
};

(node as any).hash = 'fe314a17e5dfca535b8923e4a2d03e6f';

export default node;
