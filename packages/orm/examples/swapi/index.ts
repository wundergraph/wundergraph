import { print } from 'graphql';
import { request } from 'graphql-request';

import { OperationCreator, Executor } from '../../src';
import { Schema, SCHEMA } from './schema';

const executor: Executor = {
	async execute(operation, document, variables, namespace) {
		console.log('document: ', print(document));
		console.log('variables: ', variables);

		const rawResult = await request('https://swapi-graphql.netlify.app/.netlify/functions/index', document, variables);
		// console.log(rawResult);

		return rawResult as Promise<any>;
	},
};

(async () => {
	const creator = new OperationCreator<{ schema: Schema }>({
		schema: SCHEMA,
		executor,
	});

	// const films = await creator
	// 	.query('allFilms')
	// 	.select('totalCount', 'films.id', 'films.created', 'films.producers', 'films.planetConnection.totalCount')
	// 	.where({ first: 3, films: { planetConnection: { first: 1 } } })
	// 	.exec();

	const node = await creator
		.query('node')
		// @todo modify `DefaultSelection` type to select common interface fields
		// .select('')
		.where({ id: 'ZmlsbXM6MQ==' })
		.on('Film', (t) =>
			t
				.select('title', 'speciesConnection.pageInfo.startCursor', 'speciesConnection.species.id')
				.where({ speciesConnection: { first: 2 } })
		)
		.on('Starship', (t) => t.select('MGLT'))
		.on('Planet', (t) => t.select('diameter'))
		.exec();

	console.log(node);
	// console.log('result:', films);
})();
