# Improved Response Handling to address issues with errors and caching

## Problem

Currently, we're swallowing important errors in the generated WunderGraph client.
This is because there's no clear specification of what errors should be returned by the server
and how they should be handled by the client.
The client simply returns "not ok" if the server returns a non-200 status code.

Additionally, we've observed that some caching services, like Cloudflare, cache 200 OK responses, even if they don't
contain cache-control headers.

## Status Codes

- 200 OK (execution was successful OR instantiation of live query / subscription was successful)
- 304 Not Modified (no changes - ETAG)
- 400 Bad Request (invalid input)
- 401 Unauthorized (rbac error or auth required but no identity)
- 404 Not Found (host not found)
- 499 Client Closed Request (client closed the connection)
- 500 Internal Server Error (internal error, e.g. calling hooks or execution)
- 503 Service Unavailable (misconfigured Operation)
- 504 Gateway Timeout (timeout during the execution)

## Solution

We distinguish between two types of responses:

1. Responses that were executed successfully (2xx-3xx)
2. Responses that had an error (4xx, 5xx)

Responses that were executed successfully might still contain errors,
but these errors happened during the execution of the operation,
not before.

### Caching

We explicitly set Cache-Control headers on all non-cacheable responses.
If caching is disabled, we set Cache-Control headers to enforce any proxy to not cache the response.

If the execution of an operation was successful, but the response contains errors,
we set Cache-Control headers to not cache the response.

### Bad Request: Invalid Input

We return a 400 Bad Request status code if the input is invalid.
The body will contain an error message that describes the problem in the following format:

```json
{
  "Message": "Bad Request: Invalid input",
  "Input": {
    "foo": "bar",
    "bar": [
      {
        "id": true
      }
    ]
  },
  "Errors": [
    {
      "propertyPath": "/bar/0/id",
      "invalidValue": true,
      "message": "type should be string, got boolean"
    }
  ]
}
```

This allows the caller to easily understand what input WunderGraph extracted from the request and what the problem was.

## Client implementations

Clients need to be able to handle the following cases:

- 200 & 304 => return the response, handle errors if the response contains errors
- 400 => handle the input validation error
- 401 => handle the auth error
- 404 => handle the host not found error
- 500 => handle the internal server error
- 503 => handle the misconfigured operation error
- 504 => handle the timeout error
