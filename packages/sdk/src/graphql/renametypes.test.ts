import { assert } from 'chai';
import { renameTypes } from './renametypes';
import { parse, print } from 'graphql';

const input = `
type Query {
    me: User!
}
interface Node {
    id: ID!
}
type User implements Node {
    id: ID!
    name: String!
}
union Entities = User
`;

const expected = `
type Query {
  me: PetStore_User!
}
interface PetStore_Node {
    id: ID!
}
type PetStore_User implements PetStore_Node {
    id: ID!
    name: String!
}
union PetStore_Entities = PetStore_User
`;

test('renameTypes', () => {
	const prettyExpected = print(parse(expected));
	const actual = renameTypes(input, [
		{
			from: 'User',
			to: 'PetStore_User',
		},
		{
			from: 'Node',
			to: 'PetStore_Node',
		},
		{
			from: 'Entities',
			to: 'PetStore_Entities',
		},
	]);
	assert.equal(actual, prettyExpected);
});
