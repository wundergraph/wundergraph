# WunderGraph at a glance

WunderGraph's Infrastructure-as-code approach makes it super easy to get from zero to production in three steps.

1. Define your DataSources and configure security, authentication, etc...

```typescript
// wundergraph.config.json

// Introspect a PostgreSQL Database and turn it into a GraphQL API
// The tables of the schema will be analyzed and turned into a GraphQL Schema
// Alternatively, you can also use MySQL, MongoDB, SQLite, SQLServer, Planetscale and more...
const db = introspect.postgresql({
  apiNamespace: 'db',
  databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
});

// Introspect a GraphQL Microservice
const ms = introspect.graphql({
  apiNamespace: 'ms',
  url: 'https://microservice.example.com/',
});

// Introspect the Stripe API by reading an OpenAPI Specification
// The REST API is automatically converted into a GraphQL Schema,
// you don't have to worry about writing resolvers.
const stripe = introspect.openApi({
  apiNamespace: 'stripe',
  source: {
    kind: 'file',
    filePath: 'stripe.yaml',
  },
});

// call this function to build your WunderGraph configuration,
// combining all three APIs into a unified GraphQL Schema
configureWunderGraphApplication({
  apis: [db, stripe, ms],
  authentication: {
    cookieBased: {
      providers: [
        // adding this configuration,
        // our frontend-application can delegate authentication to a 3rd party identity provider like:
        // Keycloak, Auth0, Okta, etc...
        authProviders.openIDConnect({
          id: 'myAuth', // you have to choose this ID
          clientId: 'XXX', // client ID from the OIDC provider
          clientSecret: 'XXX', // client secret from the OIDC provider
        }),
      ],
    },
  },
  codeGenerators: [
    {
      // we'd like to use WunderGraph with a NextJS application,
      // so we're using the NextJS Template for Code-Generation
      templates: [new NextJsTemplate()],
      path: '../components/generated',
    },
  ],
});
```

2. Next, let's define your first GraphQL Operation.

```graphql
# UserInfo.graphql

query (
  # the @fromClaim injects the Email address into the GraphQL Operation
  # by doing so, we're forcing the user to authenticate against our OpenID Connect provider
  # the user cannot set the email variable by themselves, it's being injected from the OIDC claims
  $email: String! @fromClaim(name: EMAIL)
) {
  userInfo: db_findFirstusers(where: { email: { equals: $email } }) {
    id
    email
    name
    lastlogin
  }
}
```

Let's add some business logic to enhance the application.

```typescript
// wundergraph.server.ts

export default configureWunderGraphServer(() => ({
  hooks: {
    authentication: {
      postAuthentication: async ({ user }) => {
        // let's add a custom hook to update the last login field for the user
        serverContext.operations.mutate({ operationName: 'SetLastLogin', email: user.email });
      },
    },
  },
}));
```

3. Now that we've defined our BFF, let's make use of it in our NextJS Application!

```typescript jsx
// userinfo.tsx

const UserInfo = () => {
  const userInfo = useQuery({
    operationName: 'UserInfo',
  });
  return (
    <div>
      <h1>UserInfo</h1>
      <p>Name: {userInfo.result.status === 'ok' && userInfo.result.data.userInfo.name}</p>
      <p>Last Login: {userInfo.result.status === 'ok' && userInfo.result.data.userInfo.lastlogin}</p>
    </div>
  );
};
```

That's it! The user can now login via OpenID Connect,
we're updating their last login value,
and they can see it from within their profile.
