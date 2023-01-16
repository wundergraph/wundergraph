# RFC - WunderStack configuration

This RFC describes a standard for configuring WunderStack components, that are automatically provisioned in WunderCloud. The goal of this proposal is to provide a consistent and type-safe way to configure WunderStack projects.

## Motivation

With the introduction of WunderStack, we need a way to configure the components that are automatically provisioned in WunderCloud.

## Solution

This solution proposes to make minimal changes to the existing WunderGraph API instead of introducing a new 'stacks' API.
WunderCloud will have a limited amount of cloud services, unlike for example AWS, where you have 100s of services, that can be composed together and configured with CDK. This means that the WunderGraph API can be more opiniated and we don't need the extra complexity of 'stacks' exposed the developers.

### S3 Storage

Currently `s3UploadProvider` accepts an array of objects, but unlike `apis` or `authentication` there are no helper methods available for specific providers. This RFC proposes to add a `storageProviders` object with helper methods for the supported providers, including WunderGraph. Even though all providers support the same s3 configuration, they can have different configuration options, like `bucketLocation`. This change allows us to make the configuration more type safe.

```ts
import { configureWunderGraphApplication, storageProviders, authProviders } from '@wundergraph/sdk';

configureWunderGraphApplication({
  apis: [],
  // previously `s3UploadProvider`
  storage: [
    storageProviders.wunderStorage({
      name: 'wg',
      bucketName: 'wg-uploads',
      uploadProfiles: {
        //...
      },
    }),
    storageProviders.awsS3({
      name: 'minio',
      endpoint: 'localhost:9000',
      accessKeyID: 'test',
      secretAccessKey: '12345678',
      bucketLocation: 'eu-central-1',
      bucketName: 'uploads',
      useSSL: false,
      uploadProfiles: {
        //...
      },
    }),
  ],
  authentication: {
    cookieBased: {
      providers: [
        authProviders.demo(),
        authProviders.openIdConnect({
          id: 'auth0',
          issuer: new EnvironmentVariable('AUTH0_ISSUER'),
          clientId: new EnvironmentVariable('AUTH0_CLIENT_ID'),
          clientSecret: new EnvironmentVariable('AUTH0_CLIENT_SECRET'),
        }),
      ],
    },
  },
});
```

The `WunderStorage` (name TBD) provider doesn't have any endpoint or credentials, because it's a managed service in WunderCloud.
When the config is build on the cloud, the endpoint and credentials are injected into the config.

### Authentication

With the same approach we can also introduce WunderGraph Auth, for example hosting Gotrue, or hosted Keycloak for pro users.

```ts
authentication: {
  cookieBased: {
    providers: [
      authProviders.wunderAuth(),
    ],
  },
},
```

### KV

Key-value stores are configured with the `kv` property. It works similar to storage and authentication. `WunderKv` is managed by WunderGraph cloud, configuration is injected into the config at build time. There can be other providers like a generic Redis provider `kvProviders.redis`.

```ts
import { configureWunderGraphApplication, kvProviders } from '@wundergraph/sdk';

configureWunderGraphApplication({
  apis: [],
  kv: [
    kvProviders.wunderKv({
      name: 'kv',
      bucketName: 'wg-uploads',
      schema: z.object({
        //...
      }),
    }),
  ],
});
```
