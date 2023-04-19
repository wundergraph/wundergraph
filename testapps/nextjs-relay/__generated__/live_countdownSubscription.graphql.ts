/**
 * @generated SignedSource<<ee76ed34d404b1dae12c2e0924c0699c>>
 * @relayHash 7fa1c86787ce1beaa648678c9d9f91a3
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 7fa1c86787ce1beaa648678c9d9f91a3

import { ConcreteRequest, GraphQLSubscription } from 'relay-runtime';
export type live_countdownSubscription$variables = {};
export type live_countdownSubscription$data = {
	readonly ws_countdown: {
		readonly countdown: number;
	};
};
export type live_countdownSubscription = {
	response: live_countdownSubscription$data;
	variables: live_countdownSubscription$variables;
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
			name: 'live_countdownSubscription',
			selections: v0 /*: any*/,
			type: 'Subscription',
			abstractKey: null,
		},
		kind: 'Request',
		operation: {
			argumentDefinitions: [],
			kind: 'Operation',
			name: 'live_countdownSubscription',
			selections: v0 /*: any*/,
		},
		params: {
			id: '7fa1c86787ce1beaa648678c9d9f91a3',
			metadata: {},
			name: 'live_countdownSubscription',
			operationKind: 'subscription',
			text: null,
		},
	};
})();

(node as any).hash = 'f804147d67eea7815c9b8328694157d2';

export default node;
