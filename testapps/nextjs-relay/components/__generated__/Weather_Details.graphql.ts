/**
 * @generated SignedSource<<6bc9744d0b7371690dbeb7cb75667649>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type Weather_Details$data = {
	readonly description: string | null;
	readonly title: string | null;
	readonly ' $fragmentType': 'Weather_Details';
};
export type Weather_Details$key = {
	readonly ' $data'?: Weather_Details$data;
	readonly ' $fragmentSpreads': FragmentRefs<'Weather_Details'>;
};

const node: ReaderFragment = {
	argumentDefinitions: [],
	kind: 'Fragment',
	metadata: null,
	name: 'Weather_Details',
	selections: [
		{
			alias: null,
			args: null,
			kind: 'ScalarField',
			name: 'title',
			storageKey: null,
		},
		{
			alias: null,
			args: null,
			kind: 'ScalarField',
			name: 'description',
			storageKey: null,
		},
	],
	type: 'weather_Summary',
	abstractKey: null,
};

(node as any).hash = '36c68eecc585e16aff22655f35e72ddd';

export default node;
