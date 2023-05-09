import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

let notes: Record<number, string> = {};

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			NoteByID: {
				mockResolve: async (hook) => {
					const noteID = hook.input.id;
					const text = notes[noteID];
					if (text != null) {
						return {
							data: {
								notes_noteByID: {
									id: noteID,
									text: text,
								},
							},
						};
					}

					return {
						error: `note ${noteID} not found`,
					};
				},
			},
		},
		mutations: {
			NewNote: {
				mockResolve: async (hook) => {
					const text = hook.input.text;
					const ids = Object.keys(notes).map((v) => parseInt(v, 10));
					const maxID = ids.length ? Math.max(...ids) : 0;
					const nextID = maxID + 1;
					notes[nextID] = text;

					return {
						data: {
							notes_newNote: {
								id: nextID,
							},
						},
					};
				},
			},
		},
	},
}));
