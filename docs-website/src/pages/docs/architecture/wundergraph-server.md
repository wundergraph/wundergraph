---
title: The WunderGraph Server
pageTitle: WunderGraph - Architecture - WunderGraph Server
description:
---

## Introduction

{% callout type="warning" %}
We highly recommend to use the Hooks Server that comes out of the box with each WunderGraph project.
{% /callout %}

The WunderGraph server is a central component in the architecture of WunderGraph. It's responsible for executing custom hooks, webhooks and TypeScript operations.
Some people might call it a Co-Processor or a Sidecar component to the WunderNode, our central Gateway component.

The server is written in Node.js. It's a standalone and stateless component that is intended to be deployed in the same network as the WunderNode.
The server must not be exposed to the public internet and is only be accessed by the WunderNode.
The WunderNode acts as a reverse proxy for the server. The server can be deployed in two different modes:

1. **Sidecar mode:** The server is started with `wunderctl start` and runs as child process of the WunderNode. This is the default mode and is useful for low traffic applications or for development.
2. **Standalone mode:** The server is started independently with `wunderctl server start` in combination with `wunderctl node start`. This is useful if you want to run the hooks server on a different machine or if you want to run multiple hooks servers for load balancing.

That being said, by implementing the Server API, you can implement your own server in any language you like.
The WunderNode is agnostic to the server implementation as long as it implements the Server API.

## Server Endpoints

The WunderNode communicates with the WunderGraph server over HTTP/1.1. The hooks server exposes the following endpoints:

- `/functions/{Name*}` - A TypeScript function. The name of the function is the full directory path of the function file relative to the `operations` directory.
- `/webhooks/{Name}` - A webhook. The name of the webhook is the name of the file in the `webhooks` directory without the file extension.
- `/operation/{Name*}/{Hook}` - Hook for a specific operation. The name is the full directory path of the operation file relative to the `operations` directory. The `Hook` is one of the following hooks: `preResolve`, `mutatingPreResolve`, `mockResolve`, `customResolve`, `postResolve`, `mutatingPostResolve`.
- `/global/httpTransport/{Hook}` - Global Hooks for HTTP origins. The `Hook` is one of the following hooks: `onOriginRequest`, `onOriginResponse`.
- `/global/wsTransport/{Hook}` - Global Hooks for WebSocket origins. The `Hook` is one of the following hooks: `onConnectionInit`.
- `/authentication/{Hook}` - Global Hooks for authentication. The `Hook` is one of the following hooks: `revalidateAuthentication`, `postLogout`, `postAuthentication`, `mutatingPostAuthentication`.
- `/upload/{providerName}/{profileName}/{Hook}` - Global Hooks for file uploads. Provider name and profile name are defined in the `wundergraph.config.ts` file. The `Hook` is one of the following hooks: `preUpload`, `postUpload`.
- `/gqls/{Name}` - A custom GraphQL server. The schema and the name of the server is defined in the `wundergraph.server.ts` file.

## Hooks Summary

The following diagram will give you a quick overview of the different hooks that are managed by the WunderGraph Server.

```
Hooks Overview
│
└─▶ Global HTTP Hooks
│   │
│   └─▶ onOriginRequest (e.g. Request manipulation, early return, for each external data-source call)
│   │
│   └─▶ onOriginResponse (e.g. Response manipulation, cancelling)
│
└─▶ Global WebSocket Hooks
│   │
│   └─▶ onConnectionInit (e.g. when you'd like to authorize the websocket connection through a connection_init message payload.)
│
└─▶ Global Authentication Hooks
│   │
│   └─▶ postLogout (e.g. Logging, auditing)
│   │
│   └─▶ revalidateAuthentication (e.g. "re-authenticate" a user.)
│   │
│   └─▶ postAuthentication (e.g. Logging, auditing)
│   │
│   └─▶ mutatingPostAuthentication (e.g. Validation)
│
└─▶ Global File Upload Hooks
│   │
│   └─▶ preUpload (e.g. validate file size, file type, manipulating storage path etc.)
│   │
│   └─▶ postUpload (e.g. logging of the result, etc.)
│
└─▶ Operational Hooks
    │
    └─▶ preResolve (e.g. Logging, auditing)
    │
    └─▶ mutatingPreResolve (e.g. Input manipulation)
    │
    └─▶ mockResolve (e.g. Request mocking)
    │
    └─▶ customResolve (e.g. Early return, custom response)
    │
    └─▶ postResolve (e.g. Logging)
    │
    └─▶ mutatingPostResolve (e.g. Input manipulation, custom response)
```

## Hooks lifecycle

The following diagram shows the execution order of the different operation hooks. The hooks are executed in the order they are listed in the diagram. The hooks are executed in the same order for every request.

```
Incoming Client Request
        │
        └─▶ preResolve
            │
            └─▶ mutatingPreResolve
                │
        *exit ◀─┴─▶ mockResolve
                │
        *exit ◀─┴─▶ customResolve
                │
                └─▶ (Internal) WunderGraph Engine - Resolve operation
                    │
            *exit ◀─┴─▶ onOriginRequest (Only for external HTTP data-source calls)
                        │
                *exit ◀─┴─▶ onOriginResponse (Companion to onOriginRequest)
                        │
                        └─▶ postResolve
                            │
                            └─▶ mutatingPostResolve
                                │
                                └─▶ Outgoing Client Response
```

- `exit` indicates that the hook can be used to abort the request in a controlled way.

## Hooks Protocol

This section specifies the Hooks protocol to intercept and manipulate requests and responses during the execution of a WunderGraph operation.
The protocol use the `application/json` Content-Type over HTTP. The protocol does not depend on framing details specific to a particular HTTP version.
Currently, the protocol is only supported over HTTP/1.1. All requests are made over HTTP POST because in all hooks we transport additional information e.g. the original client request as JSON payload.
A hook must return the status code `200` to indicate that the request should be continued. Any other status code will cancel the request.

## onOriginRequest

The `onOriginRequest` hook is executed before the WunderGraph engine makes a request to an external data-source (origin).
The hook can be used to manipulate the request before it's sent to the origin. The hook can also be used to cancel the request.

### Endpoint

`http://{serverAddress}/global/httpTransport/onOriginRequest`

**Example:**: `http://localhost:9992/global/httpTransport/onOriginRequest`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "request": {
    "method": "POST",
    "requestURI": "https://weather-api.wundergraph.com/",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Request-Id": "83850325-9638-e5af-f27d-234624aa1824"
    },
    "body": {
      "variables": {
        "capital": "Berlin"
      },
      "query": "query($capital: String!){weather_getCityByName: getCityByName(name: $capital){weather {summary {title description} temperature {actual feelsLike}}}}"
    }
  },
  "operationName": "Weather",
  "operationType": "query",
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    },
    "user": {
      "userID": "1",
      "roles": ["user"]
    }
  }
}
```

| Key                  | Type   | Description                                                                      |
| -------------------- | ------ | -------------------------------------------------------------------------------- |
| request              | Object | The original request to the origin.                                              |
| request.method       | String | The request method.                                                              |
| request.requestURI   | String | The request URI.                                                                 |
| request.headers      | Object | The request headers.                                                             |
| operationName        | String | The name of the operation.                                                       |
| operationType        | String | The type of the operation. Can only be `"query"`, `"mutation"`, `"subscription"` |
| \_\_wg               | Object | Reserved WunderGraph field.                                                      |
| \_\_wg.clientRequest | Object | The original client request.                                                     |
| \_\_wg.user          | Object | (Optional) Information about the authenthicated user.                            |

### JSON response

```json
{
  "op": "Weather",
  "hook": "onOriginRequest",
  "response": {
    "skip": false,
    "cancel": false,
    "request": {
      "method": "POST",
      "requestURI": "https://weather-api.wundergraph.com/",
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Request-Id": "83850325-9638-e5af-f27d-234624aa1824"
      },
      "body": {
        "variables": { "capital": "Berlin" },
        "query": "query($capital: String!){weather_getCityByName: getCityByName(name: $capital){weather {summary {title description} temperature {actual feelsLike}}}}"
      }
    }
  }
}
```

| Key                      | Type    | Description                           |
| ------------------------ | ------- | ------------------------------------- |
| op                       | String  | The name of the operation.            |
| hook                     | String  | The name of the hook.                 |
| response                 | Object  | The response object.                  |
| response.skip            | Boolean | If `true` the hook result is skipped. |
| response.cancel          | Boolean | If `true` the request is cancelled.   |
| response.request         | Object  | The response send to the client.      |
| response.request.headers | Object  | The client response headers.          |
| response.request.body    | Object  | The client response JSON body.        |

## onOriginResponse

The `onOriginResponse` hook is executed after the WunderGraph engine received a response from an external data-source (origin).
The hook can be used to manipulate the response before it's sent to the client. The hook can also be used to cancel the response.

### Endpoint

`http://{serverAddress}/global/httpTransport/onOriginResponse`

**Example:**: `http://localhost:9992/global/httpTransport/onOriginResponse`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "response": {
    "statusCode": 200,
    "status": "200 OK",
    "method": "POST",
    "requestURI": "https://countries.trevorblades.com/",
    "headers": {
      "Content-Type": "application/json; charset=utf-8"
    },
    "body": { "data": { "country": { "code": "DE", "name": "Germany", "capital": "Berlin" } } }
  },
  "operationName": "Weather",
  "operationType": "query",
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "de-DE,de;q=0.9,en-DE;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5"
      }
    }
  }
}
```

| Key                  | Type   | Description                                                                      |
| -------------------- | ------ | -------------------------------------------------------------------------------- |
| response             | Object | The original response from the origin.                                           |
| response.statusCode  | Number | The request method.                                                              |
| response.status      | String | The status code message.                                                         |
| response.method      | String | The request method.                                                              |
| response.requestURI  | String | The request URI.                                                                 |
| response.headers     | Object | The response headers.                                                            |
| response.body        | Object | The response body.                                                               |
| operationName        | String | The name of the operation.                                                       |
| operationType        | String | The type of the operation. Can only be `"query"`, `"mutation"`, `"subscription"` |
| \_\_wg               | Object | Reserved WunderGraph field.                                                      |
| \_\_wg.clientRequest | Object | The original client request.                                                     |
| \_\_wg.user          | Object | (Optional) Information about the authenthicated user.                            |

### JSON response

```json
{
  "op": "Weather",
  "hook": "onOriginResponse",
  "response": {
    "skip": false,
    "cancel": false,
    "response": {
      "statusCode": 200,
      "status": "200 OK",
      "method": "POST",
      "requestURI": "https://weather-api.wundergraph.com/",
      "headers": {
        "access-control-allow-origin": "*",
        "content-type": "application/json; charset=utf-8",
        "date": "Mon, 01 May 2023 10:46:39 GMT",
        "etag": "W/\"9a-nZsgz789fq7sa2/wZHsaz/msOmM\""
      },
      "body": {
        "data": {
          "weather_getCityByName": {
            "weather": {
              "summary": { "title": "Clear", "description": "clear sky" },
              "temperature": { "actual": 290.45, "feelsLike": 289.23 }
            }
          }
        }
      }
    }
  }
}
```

| Key                          | Type    | Description                               |
| ---------------------------- | ------- | ----------------------------------------- |
| op                           | String  | The name of the operation.                |
| hook                         | String  | The name of the hook.                     |
| response                     | Object  | The response object.                      |
| response.skip                | Boolean | If `true` the hook result is skipped.     |
| response.cancel              | Boolean | If `true` the request is cancelled.       |
| response.response            | Object  | The response to treat as origin response. |
| response.response.statusCode | Number  | The origin response status code.          |
| response.response.method     | String  | The origin response method.               |
| response.response.headers    | Object  | The origin response headers.              |
| response.response.body       | Object  | The origin response JSON body.            |

## onConnectionInit

The `onConnectionInit` hook is executed when the engine is initiating a WebSocket connection with a GraphQL Server.
This hook is useful, e.g. when you'd like to authorize the websocket connection through a custom `connection_init` message payload.

### Endpoint

`http://{serverAddress}/global/wsTransport/onConnectionInit`

**Example:**: `http://localhost:9992/global/wsTransport/onConnectionInit`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "dataSourceId": "1",
  "request": {
    "method": "POST",
    "requestURI": "https://weather-api.wundergraph.com/",
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Request-Id": "83850325-9638-e5af-f27d-234624aa1824"
    },
    "body": {
      "variables": { "capital": "Berlin" },
      "query": "query($capital: String!){weather_getCityByName: getCityByName(name: $capital){weather {summary {title description} temperature {actual feelsLike}}}}"
    }
  },
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "statusCode": 200,
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      "user": {
        "userID": "1",
        "roles": ["user"]
      }
    }
  }
}
```

| Key                  | Type   | Description                                                  |
| -------------------- | ------ | ------------------------------------------------------------ |
| dataSourceId         | String | The ID of the datasource. Defined in `wundergraph.config.ts` |
| request              | Object | The original client request.                                 |
| request.method       | String | The request method.                                          |
| request.requestURI   | String | The request URI.                                             |
| request.headers      | Object | The request headers.                                         |
| \_\_wg               | Object | Reserved WunderGraph field.                                  |
| \_\_wg.clientRequest | Object | The original client request.                                 |
| \_\_wg.user          | Object | (Optional) Information about the authenthicated user.        |

### JSON response

```json
{
  "hook": "onConnectionInit",
  "response": { "type": "connection_init", "payload": { "Authorization": "secret" } }
}
```

| Key      | Type   | Description                               |
| -------- | ------ | ----------------------------------------- |
| hook     | String | The name of the hook.                     |
| response | Object | The JSON payload to return to the client. |

## postLogout

The `postLogout` hook is executed after a user has logged out.

### Endpoint

`http://{serverAddress}/authentication/postLogout`

**Example:**: `http://localhost:9992/authentication/postLogout`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {},
    "user": {
      "access_token": "<secret>",
      "id_token": "<secret>"
    }
  }
}
```

| Key                      | Type   | Description                                |
| ------------------------ | ------ | ------------------------------------------ |
| \_\_wg                   | Object | Reserved WunderGraph field.                |
| \_\_wg.clientRequest     | Object | The original client request.               |
| \_\_wg.user              | Object | Information about the authenthicated user. |
| \_\_wg.user.access_token | String | The access token.                          |
| \_\_wg.user.id_token     | String | The id token.                              |

### JSON response

No response data is expected.

## revalidateAuthentication

The `revalidateAuthentication` hook is executed when the engine is revalidating the authentication of a user.
More info on how to revalidate user can be found in the [WunderGraph RPC Protocol](/docs/architecture/wundergraph-rpc-protocol-explained#cookie-based-authentication).

### Endpoint

`http://{serverAddress}/authentication/revalidateAuthentication`

**Example:**: `http://localhost:9992/authentication/revalidateAuthentication`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {},
    "user": {
      "access_token": "<secret>",
      "id_token": "<secret>"
    }
  }
}
```

| Key                      | Type   | Description                                |
| ------------------------ | ------ | ------------------------------------------ |
| \_\_wg                   | Object | Reserved WunderGraph field.                |
| \_\_wg.clientRequest     | Object | The original client request.               |
| \_\_wg.user              | Object | Information about the authenthicated user. |
| \_\_wg.user.access_token | String | The access token.                          |
| \_\_wg.user.id_token     | String | The id token.                              |

### JSON response

```json
{
  "hook": "revalidateAuthentication",
  "response": {
    "status": "ok",
    "user": {
      "userID": "1"
    }
  }
}
```

| Key             | Type   | Description                                                       |
| --------------- | ------ | ----------------------------------------------------------------- |
| hook            | String | The name of the hook.                                             |
| response        | Object | The hook response.                                                |
| response.status | String | The result of the authentication. Can only be `"ok"` or `"deny"`. |
| response.user   | Object | The full user object.                                             |

## postAuthentication

The `postAuthentication` hook is executed after the authentication has been validated and the user has been authenticated.

### Endpoint

`http://{serverAddress}/authentication/postAuthentication`

**Example:**: `http://localhost:9992/authentication/postAuthenthication`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {},
    "user": {
      "access_token": "<secret>",
      "id_token": "<secret>"
    }
  }
}
```

| Key                      | Type   | Description                                |
| ------------------------ | ------ | ------------------------------------------ |
| \_\_wg                   | Object | Reserved WunderGraph field.                |
| \_\_wg.clientRequest     | Object | The original client request.               |
| \_\_wg.user              | Object | Information about the authenthicated user. |
| \_\_wg.user.access_token | String | The access token.                          |
| \_\_wg.user.id_token     | String | The id token.                              |

### JSON response

No response data is expected.

## mutatingPostAuthentication

The `mutatingPostAuthentication` hook is executed after a user has logged in and the authentication has been validated.
This hook can be used to mutate the user object before it is returned to the client.

### Endpoint

`http://{serverAddress}/authentication/mutatingPostAuthentication`

**Example:**: `http://localhost:9992/authentication/mutatingPostAuthentication`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {},
    "user": {
      "access_token": "<secret>",
      "id_token": "<secret>"
    }
  }
}
```

| Key                      | Type   | Description                                |
| ------------------------ | ------ | ------------------------------------------ |
| \_\_wg                   | Object | Reserved WunderGraph field.                |
| \_\_wg.clientRequest     | Object | The original client request.               |
| \_\_wg.user              | Object | Information about the authenthicated user. |
| \_\_wg.user.access_token | String | The access token.                          |
| \_\_wg.user.id_token     | String | The id token.                              |

### JSON response

```json
{
  "hook": "mutatingPostAuthentication",
  "response": {
    "status": "ok",
    "user": {
      "userID": "1"
    }
  }
}
```

| Key             | Type   | Description                                                       |
| --------------- | ------ | ----------------------------------------------------------------- |
| hook            | String | The name of the hook.                                             |
| response        | Object | The hook response.                                                |
| response.status | String | The result of the authentication. Can only be `"ok"` or `"deny"`. |
| response.user   | Object | The full user object.                                             |

## preUpload

The `preUpload` hook is executed before a file is uploaded to the server. This hook can be used to validate the file before it is uploaded or to change the S3 path where the file is uploaded to.

### Endpoint

`http://{serverAddress}/upload/{providerName}/{profileName}/preUpload`

**Example:**: `http://localhost:9992/upload/aws/default/preUpload`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "file": {
    "name": "my-file.jpg",
    "type": "image/jpeg",
    "size": 12345
  },
  "meta": "meta-data",
  "__wg": {
    "clientRequest": {},
    "user": {
      "userID": "1"
    }
  }
}
```

| Key                  | Type   | Description                                                                             |
| -------------------- | ------ | --------------------------------------------------------------------------------------- |
| file                 | Object | Information about the uploaded file.                                                    |
| file.name            | String | The name of the file.                                                                   |
| file.type            | String | The MIME type of the file.                                                              |
| file.size            | Number | The size of the file in bytes.                                                          |
| meta                 | String | Additional metadata about the upload. Set by the uploader with the `X-Metadata` header. |
| \_\_wg               | Object | Reserved WunderGraph field.                                                             |
| \_\_wg.clientRequest | Object | The original client request.                                                            |
| \_\_wg.user          | Object | (Optional) The full user object.                                                        |

### JSON response

```json
{
  "error": "unauthenticated",
  "fileKey": "my-file.jpg"
}
```

| Key     | Type   | Description                                          |
| ------- | ------ | ---------------------------------------------------- |
| error   | String | The error to return when the operation is not valid. |
| fileKey | String | The file key to use in S3.                           |

## postUpload

The `postUpload` hook is executed after a file has been uploaded to the server successfully or with an error.

### Endpoint

`http://{serverAddress}/upload/{providerName}/{profileName}/postUpload`

**Example:**: `http://localhost:9992/upload/aws/default/postUpload`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "error": {
    "name": "UploadError",
    "message": "unauthenticated"
  },
  "file": {
    "name": "my-file.jpg",
    "type": "image/jpeg",
    "size": 12345
  },
  "meta": "meta-data",
  "__wg": {
    "clientRequest": {},
    "user": {
      "userID": "1"
    }
  }
}
```

| Key                  | Type   | Description                                                                                     |
| -------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| error                | Object | Information about the upload error.                                                             |
| error.name           | Object | The name of the error. Is always `"UploadError"`                                                |
| error.message        | Object | The error message of the upload error. Can be set in the `preUpload` hook.                      |
| file                 | Object | Information about the uploaded file.                                                            |
| file.name            | String | The name of the file.                                                                           |
| file.type            | String | The MIME type of the file.                                                                      |
| file.size            | Number | The size of the file in bytes.                                                                  |
| meta                 | String | Additional metadata about the upload. Set by the uploader with the `X-Metadata` request header. |
| \_\_wg               | Object | Reserved WunderGraph field.                                                                     |
| \_\_wg.clientRequest | Object | The original client request.                                                                    |
| \_\_wg.user          | Object | (Optional) The full user object.                                                                |

### JSON response

No response data is expected.

## preResolve

The `preResolve` hook is executed before a query is resolved. This hook can be used for logging.

### Endpoint

`http://{serverAddress}/operation/{operation}/preResolve`

**Example:**: `http://localhost:9992/operation/Weather/preResolve`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "de-DE,de;q=0.9,en-DE;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "Cache-Control": "max-age=0",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      }
    },
    "user": {
      "userID": "1"
    }
  },
  "input": { "code": "DE" }
}
```

| Key                  | Type   | Description                                    |
| -------------------- | ------ | ---------------------------------------------- |
| \_\_wg               | Object | Reserved WunderGraph field.                    |
| \_\_wg.clientRequest | Object | The original client request.                   |
| \_\_wg.user          | Object | (Optional) The full user object.               |
| input                | Object | (Optional) The input variables of the request. |

### JSON response

```json
{
  "op": "Weather",
  "hook": "preResolve"
}
```

| Key  | Type   | Description                |
| ---- | ------ | -------------------------- |
| op   | String | The name of the operation. |
| hook | String | The name of the hook.      |

## mutatingPreResolve

The `mutatingPreResolve` hook is executed after an operation has been resolved. This hook can be used to alter the input variables of the operation.

### Endpoint

`http://{serverAddress}/operation/{operation}/mutatingPreResolve`

**Example:**: `http://localhost:9992/operation/Weather/mutatingPreResolve`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "de-DE,de;q=0.9,en-DE;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "Cache-Control": "max-age=0",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      }
    },
    "user": {
      "userID": "1"
    }
  },
  "input": { "code": "DE" }
}
```

| Key                  | Type   | Description                                    |
| -------------------- | ------ | ---------------------------------------------- |
| \_\_wg               | Object | Reserved WunderGraph field.                    |
| \_\_wg.clientRequest | Object | The original client request.                   |
| \_\_wg.user          | Object | (Optional) The full user object.               |
| input                | Object | (Optional) The input variables of the request. |

### JSON response

```json
{
  "op": "Weather",
  "hook": "mutatingPreResolve",
  "input": { "code": "US" }
}
```

| Key   | Type   | Description                             |
| ----- | ------ | --------------------------------------- |
| op    | String | The name of the operation.              |
| hook  | String | The name of the hook.                   |
| input | Object | (Optional) The altered input variables. |

## mockResolve

The `mockResolve` hook is executed after a query has been resolved. This hook can be used to mock the response of an operation. The actual resolver will be skipped in this case.

### Endpoint

`http://{serverAddress}/operation/{operation}/mockResolve`

**Example:**: `http://localhost:9992/operation/Weather/mockResolve`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "de-DE,de;q=0.9,en-DE;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "Cache-Control": "max-age=0",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      }
    },
    "user": {
      "userID": "1"
    }
  },
  "input": { "code": "DE" }
}
```

| Key                  | Type   | Description                                    |
| -------------------- | ------ | ---------------------------------------------- |
| \_\_wg               | Object | Reserved WunderGraph field.                    |
| \_\_wg.clientRequest | Object | The original client request.                   |
| \_\_wg.user          | Object | (Optional) The full user object.               |
| input                | Object | (Optional) The input variables of the request. |

### JSON response

```json
{
  "op": "Weather",
  "hook": "mockResolve",
  "response": {
    "data": {
      "weather": {
        "temperature": 10,
        "description": "Sunny"
      }
    }
  }
}
```

| Key      | Type   | Description                          |
| -------- | ------ | ------------------------------------ |
| op       | String | The name of the operation.           |
| hook     | String | The name of the hook.                |
| response | Object | The response returned to the client. |

## customResolve

The `customResolve` hook is executed before a query has been resolved. This hook can be used to replace the default resolver with a custom resolver.

### Endpoint

`http://{serverAddress}/operation/{operation}/customResolve`

**Example:**: `http://localhost:9992/operation/Weather/customResolve`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "de-DE,de;q=0.9,en-DE;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "Cache-Control": "max-age=0",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      }
    },
    "user": {
      "userID": "1"
    }
  },
  "input": { "code": "DE" }
}
```

| Key                  | Type   | Description                                    |
| -------------------- | ------ | ---------------------------------------------- |
| \_\_wg               | Object | Reserved WunderGraph field.                    |
| \_\_wg.clientRequest | Object | The original client request.                   |
| \_\_wg.user          | Object | (Optional) The full user object.               |
| input                | Object | (Optional) The input variables of the request. |

### JSON response

```json
{
  "op": "Weather",
  "hook": "customResolve",
  "response": {
    "data": {
      "weather": {
        "temperature": 10,
        "description": "Sunny"
      }
    }
  }
}
```

| Key      | Type   | Description                                                                                                |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| op       | String | The name of the operation.                                                                                 |
| hook     | String | The name of the hook.                                                                                      |
| response | Object | (Optional) The response returned to the client. If `null` the resolver is skipped and the default is used. |

## postResolve

The `postResolve` hook is executed after a query has been resolved. This hook can be used for logging.

### Endpoint

`http://{serverAddress}/operation/{operation}/postResolve`

**Example:**: `http://localhost:9992/operation/Weather/postResolve`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "de-DE,de;q=0.9,en-DE;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "Cache-Control": "max-age=0",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      }
    },
    "user": {
      "userID": "1"
    }
  },
  "input": { "code": "DE" }
}
```

| Key                  | Type   | Description                                    |
| -------------------- | ------ | ---------------------------------------------- |
| \_\_wg               | Object | Reserved WunderGraph field.                    |
| \_\_wg.clientRequest | Object | The original client request.                   |
| \_\_wg.user          | Object | (Optional) The full user object.               |
| input                | Object | (Optional) The input variables of the request. |

### JSON response

```json
{
  "op": "Weather",
  "hook": "postResolve"
}
```

| Key  | Type   | Description                |
| ---- | ------ | -------------------------- |
| op   | String | The name of the operation. |
| hook | String | The name of the hook.      |

## mutatingPostResolve

The `mutatingPostResolve` hook is executed after an operation has been resolved. This hook can be used to modify the response of an operation.

### Endpoint

`http://{serverAddress}/operation/{operation}/mutatingPostResolve`

**Example:**: `http://localhost:9992/operation/Weather/mutatingPostResolve`

### Request Method

Delivered over `HTTP POST` with the following headers:

```none
Content-Type: application/json
X-Request-Id: "83850325-9638-e5af-f27d-234624aa1824"
```

### JSON request

```json
{
  "__wg": {
    "clientRequest": {
      "method": "GET",
      "requestURI": "/operations/Weather?code=DE",
      "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "de-DE,de;q=0.9,en-DE;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "Cache-Control": "max-age=0",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      }
    },
    "user": {
      "userID": "1"
    }
  },
  "input": { "code": "DE" },
  "response": {
    "data": {
      "weather": {
        "temperature": 10,
        "description": "Sunny"
      }
    }
  }
}
```

| Key                  | Type   | Description                                    |
| -------------------- | ------ | ---------------------------------------------- |
| \_\_wg               | Object | Reserved WunderGraph field.                    |
| \_\_wg.clientRequest | Object | The original client request.                   |
| \_\_wg.user          | Object | (Optional) The full user object.               |
| input                | Object | (Optional) The input variables of the request. |
| response             | Object | The resolved data.                             |

### JSON response

```json
{
  "op": "Weather",
  "hook": "mutatingPostResolve",
  "response": {
    "data": {
      "weather": {
        "temperature": 10,
        "description": "Sunny"
      }
    }
  }
}
```

| Key      | Type   | Description                          |
| -------- | ------ | ------------------------------------ |
| op       | String | The name of the operation.           |
| hook     | String | The name of the hook.                |
| response | String | The response returned to the client. |
