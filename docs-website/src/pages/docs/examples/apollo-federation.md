---
title: Apollo Federation Example
pageTitle: WunderGraph - Examples - Apollo Federation
description:
---

WunderGraph supports Apollo Federation out of the box,
including subscriptions, etc...

This means, you can replace Apollo Gateway / Apollo Router with the Open Source WunderGraph Gateway.
Get the benefits of a federated GraphQL API,
combined with WunderGraph features like advanced security, caching, authentication & authorization, etc...

## Setup

To make this example as easy as possible,
we're spinning up four Subgraphs using Docker Compose.
Make sure it's installed on your machine.

Then, init the project and start all services, including WunderGraph:

```bash
npx create-wundergraph-app my-project -E apollo-federation
cd my-project
npm install
npm start
```

If you check the `package.json` file,
you'll see that `npm start` will first start all Subgraphs,
waits until they are ready,
and then starts WunderGraph.

Finally, we're starting a NextJS app,
so you get the full end-to-end experience.

If you have any questions regarding this example, Federation, or WunderGraph in general,
feel free to reach out to us on Discord.
