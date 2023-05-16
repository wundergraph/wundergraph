import { expectNotAssignable } from 'tsd';

import { OperationCreator } from '../src/operation-creator';

interface Schema {
	Query: Query;
	City: City;
	Coordinates: Coordinates;
}

interface Query {
	__typename(): 'Query';
	simple(): boolean;
	getCityByName(variables: { name: string; country?: string | null }): City;
}

interface City {
	__typename(): 'City';
	id(): string | null;
	name(): string | null;
	country(): string | null;
	coord(variables: { required: string }): Coordinates | null;
}

interface Coordinates {
	x(): number;
	y(): number;
	zs(variables: { foo?: string }): Array<string>;
}

//
// filters out `__typename` fields
//
type QueryFn = InstanceType<typeof OperationCreator<{ schema: Schema }>>['query'];
type QueryableFields = Parameters<QueryFn>;

expectNotAssignable<QueryableFields>('__typename');
