/**
 * @generated SignedSource<<3a46daee4d63da2fdf8f16697b54c02a>>
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
	readonly icon: string | null;
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
		{
			alias: null,
			args: null,
			kind: 'ScalarField',
			name: 'icon',
			storageKey: null,
		},
	],
	type: 'weather_Summary',
	abstractKey: null,
};

(node as any).hash = '369f087cfe9aa28a7ccd82995d9a49dd';

export default node;
