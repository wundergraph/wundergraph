/**
 * @generated SignedSource<<76b795e6f44eab10f48ddb04bb953b8e>>
 * @relayHash 99a23a4c1b068982455fe24523f36c83
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 99a23a4c1b068982455fe24523f36c83

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type CountriesListQuery$variables = {};
export type CountriesListQuery$data = {
	readonly countries_countries: ReadonlyArray<{
		readonly continent: {
			readonly ' $fragmentSpreads': FragmentRefs<'ContinentName'>;
		};
		readonly ' $fragmentSpreads': FragmentRefs<'CountryName'>;
	}>;
};
export type CountriesListQuery = {
	response: CountriesListQuery$data;
	variables: CountriesListQuery$variables;
};

const node: ConcreteRequest = (function () {
	var v0 = {
			alias: null,
			args: null,
			kind: 'ScalarField',
			name: 'code',
			storageKey: null,
		},
		v1 = {
			alias: null,
			args: null,
			kind: 'ScalarField',
			name: 'name',
			storageKey: null,
		};
	return {
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
						{
							alias: null,
							args: null,
							concreteType: 'countries_Continent',
							kind: 'LinkedField',
							name: 'continent',
							plural: false,
							selections: [
								{
									args: null,
									kind: 'FragmentSpread',
									name: 'ContinentName',
								},
							],
							storageKey: null,
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
						v0 /*: any*/,
						v1 /*: any*/,
						{
							alias: null,
							args: null,
							concreteType: 'countries_Continent',
							kind: 'LinkedField',
							name: 'continent',
							plural: false,
							selections: [v0 /*: any*/, v1 /*: any*/],
							storageKey: null,
						},
					],
					storageKey: null,
				},
			],
		},
		params: {
			id: '99a23a4c1b068982455fe24523f36c83',
			metadata: {},
			name: 'CountriesListQuery',
			operationKind: 'query',
			text: null,
		},
	};
})();

(node as any).hash = '5354ab5d38fda80c0b86d2e26b0b32d4';

export default node;
