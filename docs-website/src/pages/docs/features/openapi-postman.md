---
title: Generate OpenAPI definitions and Postman collections
pageTitle: WunderGraph - OpenAPI definitions and Postman collection
---

## OpenAPI and Postman collection generation

Out of the box, WunderGraph supports generating an OpenAPI Specification as well as a Postman collection to
interact with your APIs. You can use them to test your API in Postman or to generate bindings to query your
API from another language.

After running `wunderctl generate`, (usually via `npm build` or `npm build:wundergraph`) both an OpenAPI
specification and a Postman collection will be produced inside `.wundergraph/generated`.

To update these files after making changes in your API, just run the code generation again.
