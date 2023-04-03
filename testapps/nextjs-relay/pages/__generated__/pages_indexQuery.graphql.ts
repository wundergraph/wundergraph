/**
 * @generated SignedSource<<f64fb635e228d16a97f8567bfe2a21d0>>
 * @relayHash 3845d1bc582930cea8624fbb505be5f7
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 3845d1bc582930cea8624fbb505be5f7

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type pages_indexQuery$variables = {
  city: string;
};
export type pages_indexQuery$data = {
  readonly weather_getCityByName: {
    readonly weather: {
      readonly summary: {
        readonly " $fragmentSpreads": FragmentRefs<"Weather_Details">;
      } | null;
      readonly temperature: {
        readonly " $fragmentSpreads": FragmentRefs<"Temperature_Details">;
      } | null;
    } | null;
  } | null;
};
export type pages_indexQuery = {
  response: pages_indexQuery$data;
  variables: pages_indexQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "city"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "name",
    "variableName": "city"
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "pages_indexQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "weather_City",
        "kind": "LinkedField",
        "name": "weather_getCityByName",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "weather_Weather",
            "kind": "LinkedField",
            "name": "weather",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "weather_Temperature",
                "kind": "LinkedField",
                "name": "temperature",
                "plural": false,
                "selections": [
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "Temperature_Details"
                  }
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "weather_Summary",
                "kind": "LinkedField",
                "name": "summary",
                "plural": false,
                "selections": [
                  {
                    "args": null,
                    "kind": "FragmentSpread",
                    "name": "Weather_Details"
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "pages_indexQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "weather_City",
        "kind": "LinkedField",
        "name": "weather_getCityByName",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "weather_Weather",
            "kind": "LinkedField",
            "name": "weather",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "weather_Temperature",
                "kind": "LinkedField",
                "name": "temperature",
                "plural": false,
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
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "weather_Summary",
                "kind": "LinkedField",
                "name": "summary",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "title",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "description",
                    "storageKey": null
                  },
                  {
                    "alias": "weatherIcon",
                    "args": null,
                    "kind": "ScalarField",
                    "name": "icon",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "id": "3845d1bc582930cea8624fbb505be5f7",
    "metadata": {},
    "name": "pages_indexQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "004342d9586324d7a0f9caa838ca73b7";

export default node;
