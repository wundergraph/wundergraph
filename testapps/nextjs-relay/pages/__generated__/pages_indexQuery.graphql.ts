/**
 * @generated SignedSource<<03ea527fc0254ebb47f0b697efe16f6d>>
 * @relayHash 05f3222dcc24dc05b04e37315cc76388
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 05f3222dcc24dc05b04e37315cc76388

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type pages_indexQuery$variables = {
	city: string;
};
export type pages_indexQuery$data = {
	readonly weather_getCityByName: {
		readonly weather: {
			readonly summary: {
				readonly ' $fragmentSpreads': FragmentRefs<'Weather_Details'>;
			} | null;
			readonly temperature: {
				readonly actual: number | null;
				readonly feelsLike: number | null;
			} | null;
		} | null;
	} | null;
};
export type pages_indexQuery = {
	response: pages_indexQuery$data;
	variables: pages_indexQuery$variables;
};

const node: ConcreteRequest = (function () {
	var v0 = [
			{
				defaultValue: null,
				kind: 'LocalArgument',
				name: 'city',
			},
		],
		v1 = [
			{
				kind: 'Variable',
				name: 'name',
				variableName: 'city',
			},
		],
		v2 = {
			alias: null,
			args: null,
			concreteType: 'weather_Temperature',
			kind: 'LinkedField',
			name: 'temperature',
			plural: false,
			selections: [
				{
					alias: null,
					args: null,
					kind: 'ScalarField',
					name: 'actual',
					storageKey: null,
				},
				{
					alias: null,
					args: null,
					kind: 'ScalarField',
					name: 'feelsLike',
					storageKey: null,
				},
			],
			storageKey: null,
		};
	return {
		fragment: {
			argumentDefinitions: v0 /*: any*/,
			kind: 'Fragment',
			metadata: null,
			name: 'pages_indexQuery',
			selections: [
				{
					alias: null,
					args: v1 /*: any*/,
					concreteType: 'weather_City',
					kind: 'LinkedField',
					name: 'weather_getCityByName',
					plural: false,
					selections: [
						{
							alias: null,
							args: null,
							concreteType: 'weather_Weather',
							kind: 'LinkedField',
							name: 'weather',
							plural: false,
							selections: [
								v2 /*: any*/,
								{
									alias: null,
									args: null,
									concreteType: 'weather_Summary',
									kind: 'LinkedField',
									name: 'summary',
									plural: false,
									selections: [
										{
											args: null,
											kind: 'FragmentSpread',
											name: 'Weather_Details',
										},
									],
									storageKey: null,
								},
							],
							storageKey: null,
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
			argumentDefinitions: v0 /*: any*/,
			kind: 'Operation',
			name: 'pages_indexQuery',
			selections: [
				{
					alias: null,
					args: v1 /*: any*/,
					concreteType: 'weather_City',
					kind: 'LinkedField',
					name: 'weather_getCityByName',
					plural: false,
					selections: [
						{
							alias: null,
							args: null,
							concreteType: 'weather_Weather',
							kind: 'LinkedField',
							name: 'weather',
							plural: false,
							selections: [
								v2 /*: any*/,
								{
									alias: null,
									args: null,
									concreteType: 'weather_Summary',
									kind: 'LinkedField',
									name: 'summary',
									plural: false,
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
									storageKey: null,
								},
							],
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
			id: '05f3222dcc24dc05b04e37315cc76388',
			metadata: {},
			name: 'pages_indexQuery',
			operationKind: 'query',
			text: null,
		},
	};
})();

(node as any).hash = '2dbe6cf2d72d83a2ac62697021271dd0';

export default node;
