---
title: Generate OpenAPI definitions and Postman collections
description: Generate OpenAPI definitions and Postman collections for your APIs.
---

## OpenAPI and Postman collection generation

Out of the box, WunderGraph supports generating an OpenAPI Specification as well as a Postman collection to
interact with your APIs. You can use them to test your API in Postman or to generate bindings to query your
API from another language.

After running `wunderctl generate`, usually via `npm build` or `npm build:wundergraph`, both an OpenAPI
specification and a Postman collection will be produced inside `.wundergraph/generated`, using the following
filenames:

- OpenAPI specification: `wundergraph.openapi.json`
- Postman collection: `wundergraph.postman.json`

To update these files after making changes in your API, just run the code generation again.

## OpenAPI customization

By default, your OpenAPI specification will use `WunderGraph Application` as its title and `0` as its version.
These can be customized by setting the `openApi` field when calling `configureWunderGraphApplication()`:

```typescript
configureWunderGraphApplication({
  openApi: {
    title: 'My Awesome API',
    apiVersion: '1.0',
  },
});
```
