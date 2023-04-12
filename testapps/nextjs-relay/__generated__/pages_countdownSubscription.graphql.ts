/**
 * @generated SignedSource<<d3f4b1d0327a417e3445ae48c77c4cd9>>
 * @relayHash c143fb10f9e3c9b01bc5b5b2ed128dbc
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID c143fb10f9e3c9b01bc5b5b2ed128dbc

import { ConcreteRequest, GraphQLSubscription } from 'relay-runtime';
export type pages_countdownSubscription$variables = {};
export type pages_countdownSubscription$data = {
	readonly ws_countdown: {
		readonly countdown: number;
	};
};
export type pages_countdownSubscription = {
	response: pages_countdownSubscription$data;
	variables: pages_countdownSubscription$variables;
};

const node: ConcreteRequest = (function () {
	var v0 = [
		{
			alias: null,
			args: [
				{
					kind: 'Literal',
					name: 'from',
					value: 100,
				},
			],
			concreteType: 'ws_Countdown',
			kind: 'LinkedField',
			name: 'ws_countdown',
			plural: false,
			selections: [
				{
					alias: null,
					args: null,
					kind: 'ScalarField',
					name: 'countdown',
					storageKey: null,
				},
			],
			storageKey: 'ws_countdown(from:100)',
		},
	];
	return {
		fragment: {
			argumentDefinitions: [],
			kind: 'Fragment',
			metadata: null,
			name: 'pages_countdownSubscription',
			selections: v0 /*: any*/,
			type: 'Subscription',
			abstractKey: null,
		},
		kind: 'Request',
		operation: {
			argumentDefinitions: [],
			kind: 'Operation',
			name: 'pages_countdownSubscription',
			selections: v0 /*: any*/,
		},
		params: {
			id: 'c143fb10f9e3c9b01bc5b5b2ed128dbc',
			metadata: {},
			name: 'pages_countdownSubscription',
			operationKind: 'subscription',
			text: null,
		},
	};
})();

(node as any).hash = '9a83903f15dada03ea478e2ba1d4566c';

export default node;
