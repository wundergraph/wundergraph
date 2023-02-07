---
title: wundergraph.config.ts reference
pageTitle: WunderGraph - wundergraph.config.ts reference
description: ''
hideTableOfContents: true
fullWidthContent: true
isIndexFile: true
---

Configuration of WunderGraph is done in `wundergraph.config.ts` using `configureWunderGraphApplication`.

Example configuration:

```typescript
// wundergraph.config.ts
import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  apis: [countries],
  server,
  operations,
  codeGenerators: [
    {
      templates: [
        // use all the typescript react templates to generate a client
        ...templates.typescript.all,
      ],
    },
  ],
  cors: {
    ...cors.allowAll,
    allowedOrigins:
      process.env.NODE_ENV === 'production'
        ? [
            // change this before deploying to production to the actual domain where you're deploying your app
            'http://localhost:3000',
          ]
        : ['http://localhost:3000', new EnvironmentVariable('WG_ALLOWED_ORIGIN')],
  },
  security: {
    enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
  },
});
```

## Supported properties

| Parameter          | Description                                      |
| ------------------ | ------------------------------------------------ |
| `apis`             | An array of data sources.                        |
| `options`          | WunderNode Options.                              |
| `server`           | WunderGraph hooks server configuration.          |
| `operations`       | WunderGraph operations configuration.            |
| `codeGenerators`   | Code generators.                                 |
| `s3UploadProvider` | Uploads configuration.                           |
| `cors`             | CORS configuration.                              |
| `authorization`    | Authorization configuration.                     |
| `authentication`   | Configure cookie and token based authentication. |
| `links`            | Link builder configuration.                      |
| `security`         | Security configuration.                          |
