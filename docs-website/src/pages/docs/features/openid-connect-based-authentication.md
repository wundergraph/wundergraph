---
title: OpenID Connect-Based Authentication
description: Configure OpenID Connect-based authentication for your application.
---

Authentication is that one topic we're spending way too much time on.
It needs to be done.
Nobody wants to do it.
It's hard.
Authentication as a Service providers try to help you but at the same time don't really make it less complicated.

We wanted to change this.
We solve authentication in a way so that the problem really goes out of your way.

This is how Authentication works with WunderGraph.

First, you define how WunderGraph should authenticate your users by declaring all the login providers.

```typescript
authentication: {
  cookieBased: {
    providers: [
      authProviders.github({
        id: 'github',
        clientId: new EnvironmentVariable('GITHUB_CLIENT_ID'),
        clientSecret: new EnvironmentVariable('GITHUB_CLIENT_SECRET'),
      }),
    ];
  }
}
```

In this case, we're using cookie based authentication with the GitHub auth provider.
Cookie based makes sense for all modern Single Page Applications.

The WunderGraph code-generator then generates a client, fully aware of the authentication method and providers.
The client provides you all the information about the user returned by the auth provider and allows you to log in and out users with one function call.

Here's an example using React & Hooks.

```typescript jsx
const IndexPage: NextPage = () => {
  const {
    client: { login, logout },
    user,
  } = useWunderGraph();
  return (
    <div>
      <p>
        {user === undefined && 'user not logged in!'}
        {user !== undefined && `name: ${user.name}, email: ${user.email}`}
      </p>
      <p>
        {user === undefined && <button onClick={() => login.github()}>login</button>}
        {user !== undefined && <button onClick={() => logout()}>logout</button>}
      </p>
    </div>
  );
};
```

As you can see, the auth provider id (github), we've specified above translates into a login function with the same name.

If you thought this was amazing, head over to the next section and read about authentication aware data fetching; that's a real beauty!
