/**
 * @generated SignedSource<<04817c17db50cdd874443201e9793794>>
 * @relayHash fd5a5e5877d98599770ea376abe61fa2
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID fd5a5e5877d98599770ea376abe61fa2

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type ContinentsListQuery$variables = {};
export type ContinentsListQuery$data = {
	readonly countries_continents: ReadonlyArray<{
		readonly ' $fragmentSpreads': FragmentRefs<'ContinentName'>;
	}>;
};
export type ContinentsListQuery = {
	response: ContinentsListQuery$data;
	variables: ContinentsListQuery$variables;
};

const node: ConcreteRequest = {
	fragment: {
		argumentDefinitions: [],
		kind: 'Fragment',
		metadata: null,
		name: 'ContinentsListQuery',
		selections: [
			{
				alias: null,
				args: null,
				concreteType: 'countries_Continent',
				kind: 'LinkedField',
				name: 'countries_continents',
				plural: true,
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
		type: 'Query',
		abstractKey: null,
	},
	kind: 'Request',
	operation: {
		argumentDefinitions: [],
		kind: 'Operation',
		name: 'ContinentsListQuery',
		selections: [
			{
				alias: null,
				args: null,
				concreteType: 'countries_Continent',
				kind: 'LinkedField',
				name: 'countries_continents',
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
		id: 'fd5a5e5877d98599770ea376abe61fa2',
		metadata: {},
		name: 'ContinentsListQuery',
		operationKind: 'query',
		text: null,
	},
};

(node as any).hash = '2aeee538a9bb53a6ed6a48f10f3ffcef';

export default node;
