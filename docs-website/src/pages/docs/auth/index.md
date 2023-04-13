---
title: Authentication Overview
pageTitle: WunderGraph - Authentication - Overview
description: An overview of authentication supported by WunderGraph.
hideTableOfContents: true
fullWidthContent: true
isIndexFile: true
---

An overview of supported authentication methods supported by WunderGraph.

## Cookie-based Auth

Cookie-Based Authentication is the best possible authentication flow to be used with a web-based application. The WunderGraph Server acts as a Token Handler in this case. The whole flow is handled server-side, on the WunderGraph server, meaning that an auth code is obtained via the browser but exchanged via the secure back-channel (server-to-server).

Once the Authentication flow is complete, a secure encrypted cookie is set, which keeps the user logged in.

{% quick-links className="lg:grid-cols-3" %}
{% quick-link title="OpenID Connect" icon="auth" href="/docs/auth/cookie-based-auth/openid-connect" description="Authenticate using OIDC." /%}
{% quick-link title="Auth0" icon="auth" href="/docs/auth/cookie-based-auth/auth0" description="Authenticate using Auth0." /%}
{% quick-link title="Google" icon="auth" href="/docs/auth/cookie-based-auth/github" description="Authenticate using Github." /%}
{% quick-link title="Github" icon="auth" href="/docs/auth/cookie-based-auth/google" description="Authenticate using Google." /%}
{% quick-link title="Keycloak" icon="auth" href="/docs/auth/cookie-based-auth/keycloak" description="Authenticate using Keycloak." /%}
{% /quick-links %}

## Token-based Auth

Token-Based Authentication is very flexible and gives you a lot of different ways of authenticating client against your WunderGraph applications. This way, you're able to use WunderGraph with code- or device flows. The responsibility to obtain an access token in this scenario is on the client itself.

{% quick-links className="lg:grid-cols-3" %}
{% quick-link title="OpenID Connect JWKS" icon="auth" href="/docs/auth/token-based-auth/openid-connect" description="Authenticate using JSON Web Key Sets." /%}
{% quick-link title="Auth.js (NextAuth)" icon="auth" href="/docs/auth/token-based-auth/auth-js" description="Authenticate using Auth.js." /%}
{% quick-link title="Clerk.com" icon="auth" href="/docs/auth/token-based-auth/clerk" description="Authenticate using Clerk.com." /%}
{% /quick-links %}
