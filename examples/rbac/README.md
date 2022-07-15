# WunderGraph RBAC

This example demonstrates how to protect WunderGraph operations using Role Based Access Controls (RBAC). We integrate two APIs:

1. (GraphQL) https://api.spacex.land/graphql/ is serving as our protected API.
2. (REST) https://api.github is needed to validate if the authenthicated user has starred our repository.

All APIs have been integrated into a unified and fully typed interface. There are no unknown dependencies in your app.

## Getting Started

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After `npm start` has been executed, your browser should open a new tab and navigate to [`http://localhost:9991/app/main/operations/Dragons`](http://localhost:9991/app/main/operations/Dragons). In the console, you can see logs emitted by the `mutatingPostResolve` hook.

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
