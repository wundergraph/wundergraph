---
title: 'Deploy to Fly.io'
pageTitle: WunderGraph - Deploy to Fly.io
description: How to deploy WunderGraph to Fly.io
---

Fly.io allows you to deploy app servers all over the world with docker containers, build packs and nix packs.

> This guide requires you to have installed Fly on your machine, you can find the [instructions here](https://fly.io/docs/hands-on/install-flyctl/).

To deploy WunderGraph to Fly.io we will be using our docker example.
Go ahead and clone to the docker repository to get started.

```bash
git clone git@github.com:wundergraph/docker.git
```

Once you've copied the repo, install all dependencies.

```bash
cd docker && npm install
```

Now we're ready to deploy our WunderGraph app to Fly.io. The the following command and follow the steps.

```bash
flyctl launch
```

After the deployment is finished, you can open the app in your browser by running the following command.

```bash
fly open
```

You'll notice the app isn't accessibble yet, the Fly app will listen to port 8080 by default, which we'll need to change to 9991.

Go ahead an edit `fly.toml`, which has just been created, and change `internal_port` to 9991.

```
[[services]]
  http_checks = []
  internal_port = 9991
```

Now run `fly deploy` to re-deploy the app with the correct internal port.
