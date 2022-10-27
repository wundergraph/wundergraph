---
title: 'Deploy to WunderGraph Cloud'
pageTitle: WunderGraph - Deploy to WunderGraph Cloud
description: How to deploy Deploy to WunderGraph Cloud
---

WunderGraph Cloud is currently in private alpha. If you haven't done so already, sign up using the banner on the top of this page.

# Requirements

There are a few requirements your project needs to have to be able to deploy to WunderGraph Cloud.

1. Your repository needs to be hosted in Github.
2. Currently only deployments on your repository default branch are supported.
3. The `.wundergraph` folder needs to be in the root of your repository.

# Setup your repository

The fastest way to get started is to [fork our example repository](https://github.com/wundergraph/docker/fork).

After forking the repo, or if you already have a repository with a WunderGraph project set up,
head over to the cloud and log in with your Github account.

# Import your repository

In the cloud dashboard click `+ New project` and then `Continue with Github` to give WunderGraph access to your repositories.

A popup wil open, now select the Github account or organization of your repository.

Choose either `All repositories` or `Only select repositiries` to give access to specific repositories.

Click `Install & Authorize`, the popup will automatically close.

You should now see your repositories listed on the dashboard, click `Import` on the repository you want to deploy.

Now choose a name and `Deploy` the project, this could take a anywhere from 30 seconds to a few minutes.

Congrats! Your first WunderGraph Cloud project has been deployed 🥳
