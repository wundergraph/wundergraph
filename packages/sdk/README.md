<div align="center">

# WunderGraph SDK

![wunderctl](https://img.shields.io/npm/v/@wundergraph/sdk.svg)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/wundergraph/wundergraph/blob/main/CONTRIBUTING.md)
[![License Apache 2](https://img.shields.io/badge/license-Apache%202-blue)](https://github.com/wundergraph/wundergraph/blob/main/LICENSE)
[![Enterprise support](https://img.shields.io/badge/enterprise-support-indigo.svg)](https://form.typeform.com/to/fuRWxErj?typeform-embed-id=8749569972809419&typeform-embed=popup-blank&typeform-source=wundergraph.com&typeform-medium=embed-sdk&typeform-medium-version=next)

[Quickstart](https://docs.wundergraph.com/getting-started)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Website](https://wundergraph.com/)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Docs](https://docs.wundergraph.com/docs)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Examples](https://docs.wundergraph.com/docs/examples)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Blog](https://wundergraph.com/blog)

  <p>
    <a href="https://twitter.com/wundergraphcom">
      <img height="24" width="24"
        src="https://user-images.githubusercontent.com/47415099/214888086-2b6077a5-b615-4acc-ae63-cb3c06e280c2.png"
        alt="Tweet us on Twitter!"
    ></a>
    <span>&nbsp;&nbsp;</span>
    <a href="https://discord.com/invite/Jjmc8TC">
      <img height="24" width="24"
        src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6ca814282eca7172c6_icon_clyde_white_RGB.svg"
        alt="Join our Discord community server!"
    ></a>
  </p>

<img height="300" width="300" src="https://user-images.githubusercontent.com/47415099/214886487-2b7adfa6-ee7f-4883-b570-77233e2a7530.png">
</div>

## What is WunderGraph?

The simplicity of RPC with the power of GraphQL; WunderGraph is an open-source framework that allows you to
quickly build end-to-end (client-to-server) type-safe APIs on any backend.

## What is WunderGraph SDK?

The WunderGraph SDK is the easiest way to configure your WunderGraph applications.
It's written in TypeScript and allows you to configure every aspect of your WunderGraph applications via Code.

WunderGraph follows best practices for infrastructure as code.
Instead of complex configurations via graphical user interfaces, WunderGraph applications are primarily configured using code.

Your configuration can be stored alongside your application code in the .wundergraph directory, keeping your application code and the API configurations in sync.

Using your CI-CD system of choice, you can deploy your WunderGraph APIs at the same time you're deploying your application code.
Go from development to production without touching a single button; simply git push and everything gets deployed.

The WunderGraph SDK works best in combination with the WunderGraph CLI, wunderctl, the Command Line Interface to initialize and run your local WunderGraph dev environment.

## Getting Started

First, initialise your WunderGraph application with the following command:

```shell
npx create-wundergraph-app <project-name> -E simple
```

You should now have an NPM package and a `.wundergraph` folder. This folder contains the following files:

- `wundergraph.config.ts` — The primary config file for your WunderGraph application. Add data sources and more.
- `wundergraph.operations.ts` — Configure authentication, caching, and more for one specific or all operations.
- `wundergraph.server.ts` — The hooks server that allows you to hook into different lifecycle events of your gateway.

After configuring your data sources, you can start writing operations.
An operation is just a `*.graphql` file, and the name of the file will be the operation name.
You can write queries, mutations, and subscriptions that span multiple data sources.
Each operation will be exposed securely via JSON-RPC-API through the WunderGraph gateway.
After writing your operations, you can start deploying your WunderGraph application.

For a more thorough introduction To WunderGraph, please visit the [architecture](./docs/architecture) documentation.
Our general documentation can also be found [here](https://docs.wundergraph.com/docs).

# Community

Want to chat about **WunderGraph** with the team and other enthusiastic developers like yourself?
We're very active on [our Discord server](https://discord.com/invite/Jjmc8TC)
and on [our GitHub](https://github.com/wundergraph/wundergraph/), where issues and PRs are very welcome
(but please read our [contribution readme](https://github.com/wundergraph/wundergraph/blob/main/CONTRIBUTING.md) first).

Now, the only thing our community is missing is you!

# Support

**Questions?** 🙋

- We're happy to help you with queries on [our Discord server](https://discord.com/invite/Jjmc8TC).

**Bugs?** 🪳

- Tell us about them [on Discord](https://discord.com/invite/Jjmc8TC),
  create a [GitHub issue](https://github.com/wundergraph/wundergraph/issues),
  or even open a [GitHub Pull Request](https://github.com/wundergraph/wundergraph/pulls).

**Need more help or interested in enterprise support?** 🤔

- [Let's chat](https://form.typeform.com/to/fuRWxErj?typeform-embed-id=8749569972809419&typeform-embed=popup-blank&typeform-source=wundergraph.com&typeform-medium=embed-sdk&typeform-medium-version=next),
  and we'll get you exactly what you need.

# Exports

- [@wundergraph/sdk/client](./client)
- [@wundergraph/sdk/internal](./internal)
- [@wundergraph/sdk/internal/logger](./logger)
- [@wundergraph/sdk/server](./server)
- [@wundergraph/sdk/testing](./testing)
