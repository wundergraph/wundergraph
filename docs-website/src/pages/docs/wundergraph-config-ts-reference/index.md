---
title: wundergraph.config.ts reference
pageTitle: WunderGraph - wundergraph.config.ts reference
description: ''
hideTableOfContents: true
fullWidthContent: true
isIndexFile: true
---

Configuration of WunderGraph is done in `wundergraph.config.ts` using `configureWunderGraphApplication`.

<<<<<<< HEAD
{% quick-links %}
{% quick-link title="WunderNode Options" icon="core" href="/docs/wundergraph-config-ts-reference/configure-wundernode-options" description="" /%}
{% quick-link title="GraphQL Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-graphql-data-source" description="" /%}
{% quick-link title="PostgreSQL Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-postgresql-data-source" description="" /%}
{% quick-link title="MySQL Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-mysql-data-source" description="" /%}
{% quick-link title="Planetscale Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-planetscale-data-source" description="" /%}
{% quick-link title="SQLite Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-sqlite-data-source" description="" /%}
{% quick-link title="SQLServer Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-sqlserver-data-source" description="" /%}
{% quick-link title="Prisma Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-prisma-data-source" description="" /%}
{% quick-link title="MongoDB / Atlas Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-mongodb-atlas-data-source" description="" /%}
{% quick-link title="Apollo Federation Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-apollo-federation-data-source" description="" /%}
{% quick-link title="OpenAPI / REST Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-openapi-rest-data-source" description="" /%}
{% quick-link title="gRPC Data Source" icon="core" href="/docs/wundergraph-config-ts-reference/configure-grpc-data-source" description="" /%}
{% quick-link title="Headers for HTTP-based Data Sources" icon="core" href="/docs/wundergraph-config-ts-reference/configure-headers-for-http-based-data-sources" description="" /%}
{% quick-link title="mTLS for HTTP-based Data Sources" icon="core" href="/docs/wundergraph-config-ts-reference/configure-mtls-for-http-based-data-sources" description="" /%}
{% quick-link title="Introspection" icon="core" href="/docs/wundergraph-config-ts-reference/configure-introspection" description="" /%}
{% quick-link title="WunderGraph Application" icon="core" href="/docs/wundergraph-config-ts-reference/configure-wundergraph-application" description="" /%}
{% quick-link title="Code Generation" icon="core" href="/docs/wundergraph-config-ts-reference/configure-code-generation" description="" /%}
{% quick-link title="CORS" icon="core" href="/docs/wundergraph-config-ts-reference/configure-cors" description="" /%}
{% quick-link title="Cookie-based Authentication" icon="core" href="/docs/wundergraph-config-ts-reference/configure-cookie-based-authentication" description="" /%}
{% quick-link title="Token-based Authentication" icon="core" href="/docs/wundergraph-config-ts-reference/configure-token-based-authentication" description="" /%}
{% quick-link title="Authorization" icon="core" href="/docs/wundergraph-config-ts-reference/configure-authorization" description="" /%}
{% quick-link title="S3 file upload providers" icon="core" href="/docs/wundergraph-config-ts-reference/configure-s3-file-upload-providers" description="" /%}
{% quick-link title="Advanced Security" icon="core" href="/docs/wundergraph-config-ts-reference/configure-advanced-security" description="" /%}
{% quick-link title="Schema Extension" icon="core" href="/docs/wundergraph-config-ts-reference/configure-schema-extension" description="" /%}
{% /quick-links %}
=======
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

> > > > > > > origin/main
