---
title: 'Deploy to Fly.io'
pageTitle: WunderGraph - Deploy to Fly.io
description: How to deploy WunderGraph to Fly.io
---

Fly.io allows you to deploy app servers all over the world with Docker containers, build packs and nix packs.

> This guide requires you to have installed Fly on your machine, you can find the [instructions here](https://fly.io/docs/hands-on/install-flyctl/).

To deploy WunderGraph to Fly.io we will be using our Docker example.
Go ahead and clone to the Docker repository to get started.

```bash
git clone git@github.com:wundergraph/docker.git
```

Once you've cloned the repo, install all dependencies.

```bash
cd docker && npm install
```

Now we're ready to deploy our WunderGraph app to Fly.io.
Run the following command and follow the steps, but do not deploy yet.

```bash
flyctl launch
```

The Fly app will listen to port 8080 by default, we'll need to change this to 9991.
Go ahead and edit `fly.toml`, which has just been created, change `internal_port` to 9991.

```
[[services]]
  http_checks = []
  internal_port = 9991
```

Now run `fly deploy` to deploy the app with the correct internal port.

```bash
fly deploy
```

After the deployment is finished, you can open the app in your browser by running the following command.

```bash
fly open
```

If everything went well, you should see something like:

```
WunderNode Status: OK
BuildInfo: {Version:0.110.0 Commit:778737fe0a65dac05d7379bae177252862792a2d Date:2022-09-19T16:02:38Z BuiltBy:ci}
```

Congrats! 🥳 You just deployed your WunderNode to Fly.io
