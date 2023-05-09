/**
 * @generated SignedSource<<9df158786f93d0b49e3a366f57dbb992>>
 * @relayHash ac0bbf845a836254bf536ee2b069dd86
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID ac0bbf845a836254bf536ee2b069dd86

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type ContinentsListQuery$variables = {};
export type ContinentsListQuery$data = {
	readonly countries_continents: ReadonlyArray<{
		readonly countries: ReadonlyArray<{
			readonly ' $fragmentSpreads': FragmentRefs<'CountryName'>;
		}>;
		readonly ' $fragmentSpreads': FragmentRefs<'ContinentName'>;
	}>;
};
export type ContinentsListQuery = {
	response: ContinentsListQuery$data;
	variables: ContinentsListQuery$variables;
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
						{
							alias: null,
							args: null,
							concreteType: 'countries_Country',
							kind: 'LinkedField',
							name: 'countries',
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
						v0 /*: any*/,
						v1 /*: any*/,
						{
							alias: null,
							args: null,
							concreteType: 'countries_Country',
							kind: 'LinkedField',
							name: 'countries',
							plural: true,
							selections: [v0 /*: any*/, v1 /*: any*/],
							storageKey: null,
						},
					],
					storageKey: null,
				},
			],
		},
		params: {
			id: 'ac0bbf845a836254bf536ee2b069dd86',
			metadata: {},
			name: 'ContinentsListQuery',
			operationKind: 'query',
			text: null,
		},
	};
})();

(node as any).hash = '14f49c06d968843abef24b70d9c7b4e0';

export default node;
