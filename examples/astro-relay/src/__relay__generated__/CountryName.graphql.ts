/**
 * @generated SignedSource<<6fb59816ac6e76da86cbc71b5456ad75>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type CountryName$data = {
	readonly code: string;
	readonly name: string;
	readonly ' $fragmentType': 'CountryName';
};
export type CountryName$key = {
	readonly ' $data'?: CountryName$data;
	readonly ' $fragmentSpreads': FragmentRefs<'CountryName'>;
};

const node: ReaderFragment = {
	argumentDefinitions: [],
	kind: 'Fragment',
	metadata: null,
	name: 'CountryName',
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
	type: 'countries_Country',
	abstractKey: null,
};

(node as any).hash = '66608063676396b8eab75368bd175a08';

export default node;
