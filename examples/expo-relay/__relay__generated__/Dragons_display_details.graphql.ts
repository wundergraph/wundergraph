/**
 * @generated SignedSource<<7f666174af5dd4f119073a8bf5d69e0f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type Dragons_display_details$data = {
	readonly active: boolean | null;
	readonly name: string | null;
	readonly ' $fragmentType': 'Dragons_display_details';
};
export type Dragons_display_details$key = {
	readonly ' $data'?: Dragons_display_details$data;
	readonly ' $fragmentSpreads': FragmentRefs<'Dragons_display_details'>;
};

const node: ReaderFragment = {
	argumentDefinitions: [],
	kind: 'Fragment',
	metadata: null,
	name: 'Dragons_display_details',
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
	],
	type: 'spacex_Dragon',
	abstractKey: null,
};

(node as any).hash = 'cc003e65642c4ee48587417d4f105092';

export default node;
