# WunderGraph OpenAPI and mocking example

This example demostrates how to connect WunderGraph with a REST API
using OpenAPI.

Mocks to develop your WunderGraph app are also provided in `wundergraph.server.ts`,
allowing you to iterate faster or even develop your app before the API is available.

#### Getting started

```shell
npm install && npm start
```

#### Create a new note

```shell
curl -d text=Hello http://localhost:9991/operations/NewNote
```

Notice the returned JSON with the newly created ID:

```json
{ "data": { "notes_newNote": { "id": 1 } } }
```

#### Get a note

```shell
curl 'http://localhost:9991/operations/NoteByID?id=1'
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
