---
title: TypeScript Operations Security
description: Learn more about the security features of TypeScript Operations
---

Here's a simplified overview of the WunderGraph architecture.

```
client -> gateway -> server
```

When defining TypeScript Operations, these are running on the server,
meaning that they are protected from the public internet by the WunderGraph Gateway.

## Authentication

The WunderGraph Gateway runs a few middlewares before allowing the request to reach the server.
E.g. if you're using cookie-based or token-based authentication,
the WunderGraph Gateway will verify that the user is authenticated.
If an operation requires authentication, you can be sure that the request will never reach the server if the user is not authenticated.

## JSON Schema Validation

Another important aspect is input validation.
TypeScript Operations allow you to define the input schema using the `zod` library.
During development, WunderGraph generated a JSON Schema from the TypeScript Operation input schema.
The WunderGraph Gateway will validate the request against this JSON Schema before passing it to the server.

This means, that if you're using TypeScript Operations, you don't have to worry about input validation.
Define an input schema using `zod` and you can trust that the request will be validated before reaching the server.

## Internal Operations

Not all operations need to exposed to the public Internet. In this case, just place the operation file under a directory named _internal_, and the operation will automatically be marked as internal.
The internal directory can be nested, and the same applies to nested operations within the internal directory.

{% callout type="warning" %}
The configuration for operations accepts and `internal` prop. This is deprecated. Please use the above method instead.
{% /callout %}
