/**
 * @generated SignedSource<<fddbc261902ec2dabada801baede98ad>>
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
	readonly weatherIcon: string | null;
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
		{
			alias: 'weatherIcon',
			args: null,
			kind: 'ScalarField',
			name: 'icon',
			storageKey: null,
		},
	],
	type: 'weather_Summary',
	abstractKey: null,
};

(node as any).hash = '838e3f49083ab58507c69886b4b537fb';

export default node;
