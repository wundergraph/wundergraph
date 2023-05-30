import path from 'path';
import { introspectOpenApiV2 } from './openapi-introspection';

describe('introspectOpenApiV2', () => {
	describe('introspection kind:file', function () {
		const fixturePath = path.join(__dirname, 'testdata', 'openapi');

		const files = [
			'spotify.yaml', // x-extension fields
			'union-types.yaml',
			// 'Looker.4.0.oas.json', // objects with name Query
			// 'split_over_files.yaml', // relative path in $ref
		];

		const runTest = (filePath: string) => {
			return introspectOpenApiV2({
				source: {
					kind: 'file',
					filePath,
				},
			});
		};

		files.forEach((file) => {
			it(`should introspect ${file} succesfully`, async () => {
				const filePath = path.join(fixturePath, file);
				const result = await (await runTest(filePath))({});
				expect(result.DataSources[0].Custom.UpstreamSchema).toMatchSnapshot();
				expect(result.Schema).toMatchSnapshot('wg_schema');
			});
		});
	});

	describe('introspection kind:string', function () {
		it('should introspect yaml string succesfully', async () => {
			const result = await (
				await introspectOpenApiV2({
					source: {
						kind: 'string',
						openAPISpec: `
openapi: 3.0.0
info:
  title: Example API
  version: 1.0.0

paths:
  /example:
    get:
      summary: Get example data
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: string`,
					},
				})
			)({});

			expect(result.DataSources[0].Custom.UpstreamSchema).toMatchSnapshot();
			expect(result.Schema).toMatchSnapshot('wg_schema');
		});

		it('should introspect json string succesfully', async () => {
			const result = await (
				await introspectOpenApiV2({
					source: {
						kind: 'string',
						openAPISpec: `
{
    "openapi": "3.0.0",
    "info": {
        "title": "Example API",
        "version": "1.0.0"
    },
    "paths": {
        "/example": {
            "get": {
                "summary": "Get example data",
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}`,
					},
				})
			)({});

			expect(result.DataSources[0].Custom.UpstreamSchema).toMatchSnapshot();
			expect(result.Schema).toMatchSnapshot('wg_schema');
		});
	});

	describe('introspection kind:object', function () {
		it('should introspect succesfully', async () => {
			const result = await (
				await introspectOpenApiV2({
					source: {
						kind: 'object',
						openAPIObject: {
							openapi: '3.0.0',
							info: {
								title: 'Example API',
								version: '1.0.0',
							},
							paths: {
								'/example': {
									get: {
										summary: 'Get example data',
										responses: {
											'200': {
												description: 'OK',
												content: {
													'application/json': {
														schema: {
															type: 'string',
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				})
			)({});

			expect(result.DataSources[0].Custom.UpstreamSchema).toMatchSnapshot();
			expect(result.Schema).toMatchSnapshot('wg_schema');
		});
	});
});
