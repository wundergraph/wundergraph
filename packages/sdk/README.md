# WunderGraph SDK

![wunderctl](https://img.shields.io/npm/v/@wundergraph/sdk.svg)

The WunderGraph SDK is the easiest way to configure your WunderGraph applications. It's written in TypeScript and allows you to configure every aspect of your WunderGraph applications via Code.

WunderGraph follows best practices for infrastructure as code. Instead of complex configurations via graphical user interfaces, WunderGraph applications are primarily configured using code.

Your configuration can be stored alongside your application code in the .wundergraph directory, keeping your application code and the API configurations in sync.

Using your CI-CD system of choice, you can deploy your WunderGraph APIs at the same time you're deploying your application code. Go from development to production without touching a single button, simply git push and everything gets deployed.

The WunderGraph SDK works best in combination with the WunderGraph CLI, wunderctl, the Command Line Interface to initialize and run your local WunderGraph dev environment.

## Getting Started

```shell
npx create-wundergraph-app <project-name> -E simple
```

# Exports

- [@wundergraph/sdk/client](./client)
- [@wundergraph/sdk/internal](./internal)
- [@wundergraph/sdk/internal/logger](./logger)
- [@wundergraph/sdk/server](./server)
- [@wundergraph/sdk/testing](./testing)
