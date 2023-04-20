/**
 * @generated SignedSource<<2cc190c888d5d525f5d3e211d74863e5>>
 * @relayHash 0e973cb3ec904ff419166e08d69cc02a
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 0e973cb3ec904ff419166e08d69cc02a

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type live_IndexQuery$variables = {
	city: string;
};
export type live_IndexQuery$data = {
	readonly weather_getCityByName: {
		readonly weather: {
			readonly summary: {
				readonly ' $fragmentSpreads': FragmentRefs<'Weather_Details'>;
			} | null;
			readonly temperature: {
				readonly ' $fragmentSpreads': FragmentRefs<'Temperature_Details'>;
			} | null;
		} | null;
	} | null;
};
export type live_IndexQuery = {
	response: live_IndexQuery$data;
	variables: live_IndexQuery$variables;
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
		];
	return {
		fragment: {
			argumentDefinitions: v0 /*: any*/,
			kind: 'Fragment',
			metadata: null,
			name: 'live_IndexQuery',
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
								{
									alias: null,
									args: null,
									concreteType: 'weather_Temperature',
									kind: 'LinkedField',
									name: 'temperature',
									plural: false,
									selections: [
										{
											args: null,
											kind: 'FragmentSpread',
											name: 'Temperature_Details',
										},
									],
									storageKey: null,
								},
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
			name: 'live_IndexQuery',
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
								{
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
											name: 'min',
											storageKey: null,
										},
										{
											alias: null,
											args: null,
											kind: 'ScalarField',
											name: 'max',
											storageKey: null,
										},
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
								},
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
										{
											alias: 'weatherIcon',
											args: null,
											kind: 'ScalarField',
											name: 'icon',
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
			id: '0e973cb3ec904ff419166e08d69cc02a',
			metadata: {},
			name: 'live_IndexQuery',
			operationKind: 'query',
			text: null,
		},
	};
})();

(node as any).hash = '1a5dae059d87661dafbd847f13e807aa';

export default node;
