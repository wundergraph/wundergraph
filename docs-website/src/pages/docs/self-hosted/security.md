---
title: 'Security'
pageTitle: WunderGraph - Security
description: Securing your self-hosted WunderGraph deployment
---

WunderGraph uses three secrets to provide authentication to your deployment.
Cryptographically-secure (pseudo-)randomly generated strings should be added to your `.env` file:

```js
// these strings are insecure examples with the intention to display length
WG_CSRF_TOKEN_SECRET = aaaaaaaaaaa; // 11 bytes
WG_SECURE_COOKIE_HASH_KEY = aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; // 32 bytes
WG_SECURE_COOKIE_BLOCK_KEY = aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; // 32 bytes
```

Although values will be generated for you in the case that they have not been supplied, these secrets are your
responsibility to generate securely.
Please ensure to use cryptographically-secure (pseudo-)randomly generated strings of the correct length.

{% callout type="warning" %}
If you do not use fixed values, WunderGraph will regenerate them with every restart.
Consequently, any users will be logged out after regeneration.
{% /callout %}

## Example generation using openssl (Windows, Linux, and MacOS)

The following shell command will produce a 32 byte string of random characters.

```bash
openssl rand -hex 32
```

## Development mode

When in development mode, WunderGraph will use temporary strings of the character "0".
These insecure strings will not be used in production.

## Warnings/Errors

{% callout %}
If you supply randomly generated strings of the correct length to your `.env` file, these errors should not occur.
{% /callout %}

```text
The secret <name> was unset and your system failed to produce a secure, randomly-generated string. Please generate a new one.
```

This warning occurs if you do not provide a secret and your system fails to produce a
fall-back cryptographically-secure randomly generated string.
In this instance, the secret(s) will remain empty and throw a real error during validation.

```text
The secret <name> was unset. A temporary randomised value has been created; please generate a new one.
```

This warning occurs if you do not provide a secret.
WunderGraph will generate one for you, but it is highly recommended that you generate your own.
