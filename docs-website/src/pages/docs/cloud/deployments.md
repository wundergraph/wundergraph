---
title: 'Deploy to WunderGraph Cloud'
pageTitle: WunderGraph - Deploy to WunderGraph Cloud
description: How to Deploy to WunderGraph Cloud
---

WunderGraph Cloud is currently in private alpha. If you haven't done so already, sign up using the banner on the top of this page.

# Requirements

There are a few requirements your project needs to have to be able to deploy to WunderGraph Cloud.

1. Your repository needs to be hosted in GitHub.
2. Currently only deployments on your repository default branch are supported.
3. The `.wundegraph` directory is optional, if it is not present, it will be identified by `wundergraph.config.ts` file location.
4. The WunderGraph project can be located in a nested directory within your repository.
5. The WunderGraph project can be deployed as a standalone project or as part of a monorepo (see the corresponding section below).

# Set up your repository

The fastest way to get started is to [fork our example repository](https://github.com/wundergraph/cloud-starter/fork).

After forking the repo, or if you already have a repository with a WunderGraph project set up,
head over to the cloud and log in with your GitHub account.

# Import your repository

In the cloud dashboard click `+ New project` and then `Continue with GitHub` to give WunderGraph access to your repositories.

A popup wil open, now select the GitHub account or organization of your repository.

Choose either `All repositories` or `Only select repositiries` to give access to specific repositories.

Click `Install & Authorize`, the popup will automatically close.

You should now see your repositories listed on the dashboard, click `Import` on the repository you want to deploy.

Now choose a name and `Deploy` the project, this could take anywhere from 30 seconds to a few minutes.

Congrats! Your first WunderGraph Cloud project has been deployed 🥳

# Deploying monorepo projects to the WunderGraph Cloud

WunderGraph now supports the deployment of monorepo projects. To be recognized as a monorepo by the WunderGraph Cloud,
your repository must meet the following criteria:

1. The root of the repository must contain a `package.json` file and the corresponding lock file (`pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`).
2. Workspaces are configured in the root `package.json` file or `pnpm-workspace.yaml` file.
3. The WunderGraph project itself should not contain its own lock file, otherwise it will be deployed as a standalone project.

If the repository meets these requirements, the WunderGraph Cloud will check for a build command in the root `package.json` file
and execute it during the deployment process.

The WunderGraph Cloud officially supports the `turborepo`, which is a type of monorepo that allows for faster and more efficient builds.
If your repository is set as a `turborepo`, no additional steps are required for deployment.
The WunderGraph Cloud will automatically recognize and deploy your `turborepo` project.

To test this feature, you can fork the [turborepo example repository](https://github.com/wundergraph/turbo-wunder-svelte/fork).
