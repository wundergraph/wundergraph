---
title: '@requireAuthentication Directive'
description: Configure an operation to require authentication
---

{% callout type="warning" %}
This directive takes priority over all other operation authentication configs.
{% /callout %}

The `@requireAuthentication` directive configures an operation to require authentication.
Data for the operation will only be returned if the user is authenticated.
If the user is not authenticated, the user will receive a `401 Unauthorized` error.

An example is shown below.

```graphql
query ($username: String!) @requireAuthentication {
  findUser(username: $username) {
    id
    email
  }
}
```
