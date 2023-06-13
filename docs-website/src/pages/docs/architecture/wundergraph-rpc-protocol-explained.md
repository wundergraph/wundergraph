---
title: The WunderGraph RPC Protocol
description: How the WunderGraph RPC Protocol works.
---

This is the WunderGraph JSON-RPC protocol.
It is used for the communication between generated WunderGraph clients and the WunderGraph server (WunderNode).

If you're implementing a WunderGraph client,
you'll need to implement the protocol.

## Operations

### URL structure

As you might already know,
WunderGraph uses a GraphQL to JSON RPC compiler which turns GraphQL Operations into JSON RPC calls.

The basic URL structure for WunderGraph Operations is:

```
https://<hostname>/operations/<operation>
```

Assuming that your domain is `example.com`,
then the URL for the `getUser` Operation would be:

```
https://example.com/operations/getUser
```

### Status Codes

- Operation executed successfully: 200
- Operation not found: 404
- Authentication/Authorization failed: 401
- Input validation failed: 400
- Operation execution failed: 500

### Queries

Queries are executed by sending a `GET` request to the URL.

For sending input variables, there are two ways to do it:

In the URL query string:

```
GET https://<hostname>/operations/<operationName>?name=Jannik
```

As a URL encoded JSON object using the `wg_variables` query parameter:

```
GET https://<hostname>/operations/<operationName>?wg_variables={"name":"Jannik"}
```

The first method is convenient if you have a flat list of variables and want to use a client like Postman or curl.
The second method should be preferred by generated clients as it supports nested variables.

Clients may append a `wg_api_hash` query parameter to the URL.
This invalidates caches for each iteration of the application.

### Mutations

Mutations are executed by sending a `POST` request to the URL.
The variables are sent as JSON in the request body.

```
POST https://<hostname>/operations/<operationName>
Content-Type: application/json

{
  "name": "Jannik"
}
```

Clients that use WunderGraph's cookie-based authentication may want to set the `X-CSRF-Token` header.
If this is not set, the server will reject the request.

Acquiring a CSRF token is done by following the instructions in the [CSRF Protection](/docs/architecture/wundergraph-rpc-protocol-explained#csrf-protection) section.

### Subscriptions

Subscriptions are executed by sending a `GET` request to the URL.
The response is a stream of JSON objects,
**delimited by two newline characters**.

Input variables are sent the same way as queries.

```
GET https://<hostname>/operations/<operationName>?name=Jannik
```

The server will not end the stream.
It will keep sending data until the client disconnects.

The client may add an optional `wg_subscribe_once` query parameter to the URL.
If this query parameter exists, the server will send a single message and then disconnect.
This is useful, e.g. if you'd like to server-side render a page with the first message.

The client may add an optional `wg_sse` query parameter to the URL.
If this query parameter exists, the server will send the messages using the [Server-Sent Events](https://en.wikipedia.org/wiki/Server-sent_events) protocol.
Each message will be prefixed with `data: `.
This is useful, e.g. if you want to add better debugging capabilities,
as browsers can parse the messages as [Server-Sent Events](https://en.wikipedia.org/wiki/Server-sent_events).

### Live Queries

Live Queries are executed by sending a `GET` request to the URL.
The response is a stream of JSON objects,
**delimited by two newline characters**.

Variables are sent the same way as queries.

Clients must add the `wg_live` query parameter to the URL,
to indicate that they want to receive live updates.

```
GET https://<hostname>/operations/<operationName>?name=Jannik&wg_live
```

## Streaming Responses (Subscriptions and Live Queries)

For streaming responses like Subscriptions and Live Queries,
there are a few things to keep in mind.

### SSE (Server-Sent Events)

WunderGraph supports SSE for streaming responses.
If a client wants to consume a streaming response as SSE,
it should add the `wg_sse` query parameter to the URL.

```
GET https://<hostname>/operations/<operationName>?wg_sse
```

This will prefix each message with `data: `, which is the format used by SSE.
This way, browsers can use the `EventSource` API to consume the stream.
The WunderGraph TypeScript Client does this automatically.

There's one caveat though.
When the server intends to close the connection,
the client will always reconnect, as this is the default behavior of the `EventSource` API.

For this reason, the server will always send a `data: done` message before closing the connection to indicate that there will be no more messages.

### JSON-Patch (RFC 6902) Support for Streaming Responses

WunderGraph supports JSON-Patch for streaming responses.
If a client wants to consume a streaming response as JSON-Patch,
it should add the `wg_json_patch` query parameter to the URL.

```
GET https://<hostname>/operations/<operationName>?wg_json_patch
```

You can combine this with the `wg_sse` query parameter to get SSE with JSON-Patch.

```
GET https://<hostname>/operations/<operationName>?wg_sse&wg_json_patch
```

With JSON-Patch enabled, the server will always calculate the difference between the previous message and the current message.
If the generated JSON-Patch is smaller than the next message, the server will send the JSON-Patch instead of the next message.
If the generated JSON-Patch is larger than the next message, the server will send the next message.

A JSON-Patch response is always an array of JSON-Patch operations,
as defined in [RFC 6902](https://tools.ietf.org/html/rfc6902),
whereas a normal response is a JSON object.

A client can distinguish between a JSON-Patch response and a normal response by checking the first character of the response,
which is always `[` for a JSON-Patch response and `{` for a normal response.
Alternatively, the client can parse the response as JSON and check if it's an array or an object.

## Response format

The response format for all operations is a JSON object with two root fields,
`data` and `errors`.

It's possible that both fields are present.
In this case, the operation partially failed.

If only an errors object is present, the operation failed.

If only a data object is present, the operation succeeded.

The type of the data object is inferred from the operation.

The type of the errors object is and array of objects with the following fields:

```graphql
type Error {
  message: String
  path: [String]
}
```

## Authentication

WunderGraph supports authentication via cookies and token based authentication.

### Cookie based authentication

To start the authentication flow,
the client should send a `GET` request to the URL:

```
GET https://<hostname>/auth/cookie/authorize/<authProviderID>
```

The client must send a `redirect_uri` query parameter to the URL.
This is the URL the client should redirect to after the authentication flow is finished.
Note that the redirect URI must be whitelisted in the WunderGraph server configuration.

Once the authentication was successful, and the user cookie is set,
the user can be fetched sending a `GET` request to the URL:

```
GET https://<hostname>/auth/cookie/user
```

The client may add an optional `revalidate` query parameter to the URL.
If this query parameter exists, the server will trigger the revalidation of the user's auth state,
allowing the backend to update or revoke the user's auth state.

If the user is logged in, this endpoint will return an HTTP `200` with the JSON encoded `User` object
as the response body. If no user is logged in, it will return an empty response with a `204` response
code.

### Token based authentication

For non-browser based clients,
it's also possible to use token based authentication.

In this case, the client needs to add the following headers to the request:

```
Authorization: Bearer <token>
```

The bearer token needs to be acquired from the Identity Provider,
this is outside the scope of WunderGraph.

Usually, a standard OpenID Connect client can be used.

## CSRF Protection

WunderGraph automatically protects Mutations from CSRF attacks.
The client needs to acquire a CSRF token and set it in the `X-CSRF-Token` header.

To get the token, the client needs to call the `csrf` endpoint.

```
GET https://<hostname>/auth/cookie/csrf
```

The response contains the cookie in text format.
After authentication,
the client needs to acquire a new CSRF token by calling the `csrf` endpoint again.

## File Uploads

WunderGraph supports file uploads.
Files are sent as multipart/form-data encoded HTTP requests.

Files need to be added as a `files` field to the multipart object and sent as a `POST` request to the following URL:

```
POST https://<hostname>/s3/<storageID>/upload
```

The response contains a json object with the field `fileKeys`,
which is a list of generated IDs for the uploaded files.
