---
title: wundergraph.server.ts reference
description: Reference documentation for wundergraph.server.ts
hideTableOfContents: true
fullWidthContent: true
isIndexFile: true
---

Here's an overview of all the different options to extend your WunderGraph Server using custom hooks and custom GraphQL resolvers.

{% quick-links %}
{% quick-link title="WunderGraph Server Options" icon="core" href="/docs/wundergraph-server-ts-reference/configure-wundergraph-server-options" description="" /%}
{% quick-link title="webhooks" icon="core" href="/docs/wundergraph-server-ts-reference/webhooks" description="Configures your custom webhook endpoints." /%}
{% quick-link title="preResolve hook" icon="core" href="/docs/wundergraph-server-ts-reference/pre-resolve-hook" description="This hook is called BEFORE on Operation is resolved." /%}
{% quick-link title="mutatingPreResolve hook" icon="core" href="/docs/wundergraph-server-ts-reference/mutating-pre-resolve-hook" description="This hook is called BEFORE an operation is resolved, it can manipulate the input." /%}
{% quick-link title="postResolve hook" icon="core" href="/docs/wundergraph-server-ts-reference/post-resolve-hook" description="This hook is called AFTER the operation is resolved." /%}
{% quick-link title="mutatingPostResolve hook" icon="core" href="/docs/wundergraph-server-ts-reference/mutating-post-resolve-hook" description="This hook is called AFTER the operation is resolved and can be used to manipulate the response." /%}
{% quick-link title="mockResolve hook" icon="core" href="/docs/wundergraph-server-ts-reference/mock-resolve-hook" description="Return mock data instead of calling the real resolver." /%}
{% quick-link title="customResolve hook" icon="core" href="/docs/wundergraph-server-ts-reference/custom-resolve-hook" description="Skip the original resolver and fully replace it." /%}
{% quick-link title="onOriginRequest hook" icon="core" href="/docs/wundergraph-server-ts-reference/on-origin-request-hook" description="Customize all requests before they get sent to an origin." /%}
{% quick-link title="onOriginResponse hook" icon="core" href="/docs/wundergraph-server-ts-reference/on-origin-response-hook" description="Customize all responses after they come back from an origin." /%}
{% quick-link title="onWsConnectionInit hook" icon="core" href="/docs/wundergraph-server-ts-reference/ws-transport-connection-init-hook" description="Customize ws connection init message payload." /%}
{% quick-link title="postAuthentication hook" icon="core" href="/docs/wundergraph-server-ts-reference/post-authentication-hook" description="This hook is called AFTER the authentication flow is complete." /%}
{% quick-link title="revalidate hook" icon="core" href="/docs/wundergraph-server-ts-reference/revalidate-hook" description="This hook is called when the user calls the user endpoint with the revalidate option." /%}
{% quick-link title="mutatingPostAuthentication hook" icon="core" href="/docs/wundergraph-server-ts-reference/mutating-post-authentication-hook" description="This hook can be used to manipulate the user object AFTER the authentication flow is complete." /%}
{% quick-link title="postLogout hook" icon="core" href="/docs/wundergraph-server-ts-reference/post-logout-hook" description="This hook is called AFTER the user is logged out." /%}
{% quick-link title="Custom GraphQL Servers" icon="core" href="/docs/wundergraph-server-ts-reference/custom-graphql-servers" description="Write custom GraphQL servers/resolvers to extend your Virtual Graph." /%}
{% quick-link title="Context factory" icon="core" href="/docs/wundergraph-server-ts-reference/context-factory" description="Extend the WunderGraph server context." /%}
{% /quick-links %}
