---
title: 'Deploy to WunderGraph Cloud'
pageTitle: WunderGraph - Deploy to WunderGraph Cloud
description: How to deploy to WunderGraph Cloud
---

# Introduction

WunderGraph Cloud is currently in private alpha. If you haven't done so already, sign up using the banner on the top of this page.

# Requirements

Your project must meet the following requirements to be eligible for deployment on WunderGraph Cloud:

- The repository must be hosted on GitHub.
- Currently only deployments on your repository default branch are supported.
- The presence of the `.wundergraph` directory is optional. If it is not present, it will be detected by the `wundergraph.config.ts` file.
- The WunderGraph project can be in a nested folder, or in the root of the repository.
- The WunderGraph project can be deployed as a standalone project or as part of a monorepo (see the corresponding section below).

# Video

Watch the video how to deploy in 1.30 minute or continue reading below at your own pace.

{% youtube id="yaZuQ32sSSE" /%}

# Set up your repository

The fastest way to get started is to [fork our example repository](https://github.com/wundergraph/cloud-starter/fork).

If you already have a repository with a WunderGraph project set up,
head over to the WunderGraph Cloud and log in with your GitHub account.

# Import your repository

- In the WunderGraph Cloud dashboard, click `+ New project` and then `Continue with Github` to give WunderGraph access to your repositories.

- In the popup, select the GitHub account or organization that your repository belongs to.

- Choose either `All repositories` or `Only select repositiries` to give access to specific repositories.

- Click `Install & Authorize`, and the popup will automatically close.

Your repositories should now be listed on the dashboard.

# Deploy your project

- In the WunderGraph Cloud dashboard, click `+ New project` and choose your repository from the list.

- Click `Import`, then edit the project name and choose the region for deployment (optional).

- Click `Deploy`, and wait for the project to be deployed, which may take 30 seconds to a few minutes.

Congrats! Your first WunderGraph Cloud project has been deployed 🥳

# Deploy a template

You can deploy one of our templates directly from the cloud dashboard.

- In the WunderGraph Cloud dashboard click `+ New project` and choose one of the templates from the `Clone a template` section.

- The repository name will be generated for you, but you can change it by editing the `Repository name` field.

- You can make the repository private by checking the `Create a private repository` checkbox.

- On the `Clone a template` page, you can also check `Git repository` section and click on the template repository name to be redirected to the GitHub repository and explore the code.

- Click `Create` to create the repository with a WunderGraph project in your GitHub account.

- Edit the project name and choose the region for deployment (optional).

- Click `Deploy` to deploy the project.

# Deploy monorepo project

WunderGraph Cloud supports the deployment of monorepo projects that meet the following criteria:

1. The root of the repository must contain a `package.json` file and the corresponding lock file (`pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`).
2. Workspaces are configured in the root `package.json` file or `pnpm-workspace.yaml` file.
3. The WunderGraph project itself should not contain its own lock file, otherwise it will be deployed as a standalone project.

If the repository meets these requirements, WunderGraph Cloud will check for a build command in the root `package.json` file
and execute it during the deployment process.

The WunderGraph Cloud officially supports `turborepo`, which is a type of monorepo that allows for faster and more efficient builds.
If you have a `turbo.json` at the root of your repository, no additional steps are required for the deployment.

To test this feature, you can [fork our turborepo example repository](https://github.com/wundergraph/cloud-starter-turbo/fork).

Follow the steps from the `Import your repository` and `Deploy your project`.

# Redeploy

- Make changes to the `main` branch, e.g. change a query in `.wundergraph/operations/`.

- Commit and push the changes.

- See changes live in less than a minute.

# Build script convention

{% callout title="Priority of build scripts" %}
WunderGraph Cloud will prioritise build scripts in the following order:

`wg.toml` > `package.json build:wundergraph` > `package.json build`
{% /callout %}

- If your `package.json` file contains a build:wundergraph script, WunderGraph Cloud will execute it during deployment.
- If no build:wundergraph script, WunderGraph Cloud will fall back to build script.
- If no build script, WunderGraph Cloud will execute `wunderctl generate` by default and detect the WunderGraph project's location
  via `wundergraph.config.ts` file.

As an example, let's check our [cloud-starter repository](https://github.com/wundergraph/cloud-starter/)

```json
{
  "name": "wundergraph-simple",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "start": "wunderctl up --debug",
    "build:wundergraph": "wunderctl generate --debug --pretty-logging=true",
    "build": "npm run build:wundergraph",
    "check": "tsc --noEmit"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@wundergraph/sdk": "^0.133.1"
  },
  "devDependencies": {
    "@types/node": "^14.14.37",
    "typescript": "^4.8.2"
  }
}
```

As you can see, we have a `build` script, which is executed during the build process.
This repository contains a `.wundergraph` directory, so we don't need to specify the path.

If you renamed the `.wundergraph` directory to `app` for example, the build script would look like this:

```json
{
  "scripts": {
    "build": "wunderctl generate --debug --pretty-logging=true --wundergraph-dir app"
  }
}
```

If you don't have the `.wundergraph` directory, the build script would look like this:

```json
{
  "scripts": {
    "build": "wunderctl generate --debug --pretty-logging=true --wundergraph-dir ."
  }
}
```

Note that `--wundergraph-dir .` is used to specify the current directory.

However, as mentioned above, if you don't have a build script,
WunderGraph Cloud will automatically detect the path to the wundergraph dir, and execute `wunderctl generate` command by default.

In case you have a monorepo project, you will need to make WunderGraph part of the build pipeline.

As an example, let's check our [cloud-starter-turbo repository](https://github.com/wundergraph/cloud-starter-turbo/)
At the root of the repository, we have a `pcakage.json` file with a following content:

```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "generate": "turbo run generate"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "packageManager": "npm@8.19.3",
  "volta": {
    "node": "18.0.0",
    "npm": "8.19.3"
  }
}
```

As you can see:

- `workspaces` are configured, so the repository is recognized as a monorepo by WunderGraph Cloud.
- `build` script is configured, so WunderGraph Cloud will execute it during the deployment process.

In this case `turbo` will execute `build` script in each workspace, our wundergraph project is located in the `apps/api` directory.
Let's check the `apps/api/package.json` file:

```json
{
  "name": "api",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "dev": "wunderctl up --debug --wundergraph-dir .",
    "build": "wunderctl generate --debug --wundergraph-dir .",
    "check": "tsc --noEmit"
  },
  "author": "",
  "dependencies": {
    "@wundergraph/sdk": "^0.133.1"
  },
  "devDependencies": {
    "@types/node": "^17.0.15",
    "typescript": "^4.8.2"
  }
}
```

The build script is defined similarly to the previous example.

The proper configuration of the build script is crucial for the correct deployment of the monorepo project.

This example is based on the `turbo` monorepo, but you can use any other monorepo tool.

# Lock files

WunderGraph Cloud supports the following lock files:

- `pnpm-lock.yaml`
- `yarn.lock`
- `package-lock.json`

Based on the lock file, WunderGraph Cloud will install the dependencies using the corresponding package manager.

Important to note:

- If WunderGraph project is a part of the monorepo, the lock file should be located in the root of the repository.
- If WunderGraph project is a part of the monorepo, but should be deployed as a standalone project, it should contain its own lock file.
- If WunderGraph is a standalone project, the lock file is optional, but recommended.
  If the lock file is not present, WunderGraph Cloud will install the dependencies using the `pnpm` package manager.
  But we strongly don't recommend this approach!

# Environment variables

Environment variables are encrypted. They are only decrypted at build and at runtime.
They are useful for storing API keys, database passwords, and other information.
After adding a new variable, you no longer have access to the value in the UI.
A new deployment is required for your changes to take effect.

You can set environment variables in the `Settings` tab of your project, once your project is deployed.
