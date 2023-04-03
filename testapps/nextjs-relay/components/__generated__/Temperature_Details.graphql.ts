/**
 * @generated SignedSource<<a7eba88d6d7ba37572c5dec0bfeddbce>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type Temperature_Details$data = {
  readonly actual: number | null;
  readonly feelsLike: number | null;
  readonly max: number | null;
  readonly min: number | null;
  readonly " $fragmentType": "Temperature_Details";
};
export type Temperature_Details$key = {
  readonly " $data"?: Temperature_Details$data;
  readonly " $fragmentSpreads": FragmentRefs<"Temperature_Details">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "Temperature_Details",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "min",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "max",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "actual",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "feelsLike",
      "storageKey": null
    }
  ],
  "type": "weather_Temperature",
  "abstractKey": null
};

(node as any).hash = "850b7b3132aa6bab7e0780755c585e5e";

export default node;
