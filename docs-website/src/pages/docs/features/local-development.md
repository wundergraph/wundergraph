---
title: Local Development
description: Develop your WunderGraph application locally
---

Modern technologies like Serverless are easy to scale in the cloud but make it hard to develop on your local machine.

Emulators are simply not capable of delivering the same look and feel as if you were running your application in the could.

As we've stated in various places, we're using WunderGraph to build WunderGraph.
One of our prime directives is that we, ourselves, want the best possible developer experience, even on localhost.

For that reason, we've built WunderGraph in a way that enables developers to easily build WunderGraph applications on their local machine.

Once you have a WunderGraph application initialized you're able to start your local dev environment with the commands:

```shell
npx create-wundergraph-app <project-name> -E simple
cd <project-name>
npm install && npm start
```

That's all it takes to run your own WunderGraph dev environment.
It's not lacking any features,
as we're always developing for local first and then for the cloud.
