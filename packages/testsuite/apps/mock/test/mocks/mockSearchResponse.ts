export const mockSearchResponse = {
	took: 3,
	timed_out: false,
	hits: {
		total: {
			value: 1,
			relation: 'eq',
		},
		max_score: 1.0,
		hits: [
			{
				_index: 'superheroes',
				_type: '_doc',
				_id: '1',
				_score: 1.0,
				_source: {
					superheroes: [
						{
							'Hero name': 'Superman',
							'Real identity': 'Clark Kent',
							Age: 28,
						},
						{
							'Hero name': 'Batman',
							'Real identity': 'Bruce Wayne',
							Age: 26,
						},
					],
				},
			},
		],
	},
};
