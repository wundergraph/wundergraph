/**
 * @generated SignedSource<<1aa405a029fd1c2d9e3be9a801494e4e>>
 * @relayHash d3c940a274d900266a6b910a99e66f42
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID d3c940a274d900266a6b910a99e66f42

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from 'relay-runtime';
export type indexPage_indexQuery$variables = {
	city: string;
};
export type indexPage_indexQuery$data = {
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
export type indexPage_indexQuery = {
	response: indexPage_indexQuery$data;
	variables: indexPage_indexQuery$variables;
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
			name: 'indexPage_indexQuery',
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
			name: 'indexPage_indexQuery',
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
			id: 'd3c940a274d900266a6b910a99e66f42',
			metadata: {},
			name: 'indexPage_indexQuery',
			operationKind: 'query',
			text: null,
		},
	};
})();

(node as any).hash = 'fd117469fa7e076ea0ecf81357f141ad';

export default node;
