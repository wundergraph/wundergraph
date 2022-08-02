---
title: '@injectEnvironmentVariable Directive'
pageTitle: WunderGraph - Directives - @injectEnvironmentVariable
description:
---

The `@injectEnvironmentVariable` allows you to inject an environment variable into a VariableDefinition of your GraphQL Operations.

A potential use-case could be that you've got an application secret which you'd like to inject as an application ID.
In this case, you don't want the user to be allowed to set the variable.
Additionally, you might want to use different variables for different mutations or queries.

```graphql
mutation (
  $loginID: String!
  $applicationID: String! @injectEnvironmentVariable(name: "AUTH_APP_ID")
) {
  authStart(input: { applicationId: $applicationID, loginId: $loginID }) {
    code
  }
}
```

The directive `@injectEnvironmentVariable` will enforce two things.
For one, it will remove the annotated variable definition from the JSON Schema to validate the user-supplied variables.
This means, the user is not allowed to set `$applicationID` in this scenario.
Furthermore, the variable is not even visible to the user, it doesn't exist to them.
Second, the variable is injected from the environment into the variables before executing the Operation.
