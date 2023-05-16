/**
 * @generated SignedSource<<bc1e2bed134d51b523a861300c6402e9>>
 * @relayHash c11158afcc8e55409b96972f20e26fa1
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID c11158afcc8e55409b96972f20e26fa1

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type DragonsListDragonsQuery$variables = {};
export type DragonsListDragonsQuery$data = {
	readonly spacex_dragons: ReadonlyArray<{
		readonly ' $fragmentSpreads': FragmentRefs<'Dragons_display_details'>;
	} | null> | null;
};
export type DragonsListDragonsQuery = {
	response: DragonsListDragonsQuery$data;
	variables: DragonsListDragonsQuery$variables;
};

const node: ConcreteRequest = {
	fragment: {
		argumentDefinitions: [],
		kind: 'Fragment',
		metadata: null,
		name: 'DragonsListDragonsQuery',
		selections: [
			{
				alias: null,
				args: null,
				concreteType: 'spacex_Dragon',
				kind: 'LinkedField',
				name: 'spacex_dragons',
				plural: true,
				selections: [
					{
						args: null,
						kind: 'FragmentSpread',
						name: 'Dragons_display_details',
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
		name: 'DragonsListDragonsQuery',
		selections: [
			{
				alias: null,
				args: null,
				concreteType: 'spacex_Dragon',
				kind: 'LinkedField',
				name: 'spacex_dragons',
				plural: true,
				selections: [
					{
						alias: null,
						args: null,
						kind: 'ScalarField',
						name: 'name',
						storageKey: null,
					},
					{
						alias: null,
						args: null,
						kind: 'ScalarField',
						name: 'active',
						storageKey: null,
					},
					{
						alias: null,
						args: null,
						kind: 'ScalarField',
						name: 'id',
						storageKey: null,
					},
				],
				storageKey: null,
			},
		],
	},
	params: {
		id: 'c11158afcc8e55409b96972f20e26fa1',
		metadata: {},
		name: 'DragonsListDragonsQuery',
		operationKind: 'query',
		text: null,
	},
};

(node as any).hash = '6b2e048db1a6f20951108de3e1f3d63c';

export default node;
