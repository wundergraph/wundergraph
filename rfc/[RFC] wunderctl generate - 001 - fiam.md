# RFC - wunderctl generate

There are several features of WunderGraph that require a bit of boiletplate to get started.

# Motivation

Having a minimal example that works can function as a building block into tackling a more
complex problem. Automatically generating this initial code could help speeding up
development significantly.

# Proposed solution

Provide a `wunderctl` subcommand that can do the appropriate code generation, prompting for
questions when required. Since there are unlimited possibilities regarding what this command
could do, we'll provide some examples.

# Example integrations

## Generate a test for an operation

Given a an operation with no inputs:

```graphql
query Continents {
  countries_continents {
    name
    code
  }
}
```

Users could use `wunderctl generate jest Continents` to generate a basic jest test, which would look
like:

```typescript
test('continents', async () => {
  const result = await wg.client().query({
    operationName: 'Continents',
  });
  expect(result.data).isTruthy();
});
```

To simplify the initial implementation, we would generate a dedicated file per test.

If jest is not setup for the package, we would also install the required dependencies and set up the package.

## Generation an operation for a GraphQL query

Given a GraphQL query like:

```graphql
type Query {
  notes_noteByID(noteID: Int!): notes_QueryNoteById
}

type notes_QueryNoteById {
  id: Int
  text: String
  _join: Query!
}
```

Users could type `wunderctl generate query notes_noteByID NoteByID` and generate the following operation:

```graphql
# operations/NoteByID
query ($id: Int!) {
  notes_noteByID(noteID: $id) {
    id
    text
  }
}
```

## Other potential WunderGraph features

- `wunderctl generate hook`
- `wunderctl generate webhook`
- `wunderctl generate email`
- `wunderctl generate authentication`
- `wunderctl generate wunderbase`
- `wunderctl generate cron`

## 3rd party API integrations

`wunderctl generate` could also be extended to generate the boilerplate for integrating an API. Maybe this
could also be a separate command called `wunderctl integrate`?

- `wunderctl generate github`: Downloads GH OpenAPI spec, prints code to be added to the operations
- `wunderctl generate payments`: Prompts user for a payment provider, sets up API
