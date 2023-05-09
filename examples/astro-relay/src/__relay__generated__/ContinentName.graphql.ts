/**
 * @generated SignedSource<<8ca356fc272ace5757a11ff44f056745>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type ContinentName$data = {
	readonly code: string;
	readonly name: string;
	readonly ' $fragmentType': 'ContinentName';
};
export type ContinentName$key = {
	readonly ' $data'?: ContinentName$data;
	readonly ' $fragmentSpreads': FragmentRefs<'ContinentName'>;
};

const node: ReaderFragment = {
	argumentDefinitions: [],
	kind: 'Fragment',
	metadata: null,
	name: 'ContinentName',
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
	type: 'countries_Continent',
	abstractKey: null,
};

(node as any).hash = 'b76f2ca3b6c73d2017e42a71a2f26bc7';

export default node;
