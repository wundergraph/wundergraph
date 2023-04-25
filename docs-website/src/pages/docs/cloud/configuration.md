---
title: 'Workspace Configuration (wg.toml)'
pageTitle: WunderGraph - WunderGraph Cloud Workspace Configuration (wg.toml)
description: Configure your WunderGraph Cloud Project
---

Optionally, WunderGraph Cloud uses a `wg.toml` file to configure your cloud project. This file is located in the root of your repository.
You can configure multiple projects in a single repository. This is useful, if you have a monorepo with multiple WunderGraph projects. If you have a single workspace, you can skip this section and we will auto-detect your repository.
In the future, we might add more configuration options to this file.

> Note: If you are not familiar with writing TOML files, you can visit [https://toml.io/](https://toml.io/) to learn it.

```toml
# This is a TOML document to configure your Wundergraph workspaces.
# For more information, see https://docs.wundergraph.com/docs/cloud/configuration

version = 1

[[projects]]
name = "project-a" # The name of the project in WunderGraph Cloud
workspace = "/path/to/your/workspace"
build_command = "npx turbo build --filter=workspace1"

[[projects]]
name = "project-b"
workspace = "/path/to/your/workspace"
build_command = "npx turbo build --filter=workspace2"
```

## Configuration Options

### version

The `version` field is optional. If you don't specify it, the latest version will be used.

### projects

The `projects` field is optional. It contains a list of projects. Each project has a name and a workspace path.

- `name` field is required. It contains the name of the project. The name is used to identify the project in the WunderGraph Cloud CI.
- `workspace` field is required. It contains the path to the workspace directory. The path is absolute to the root of the repository.
- `build_command` field is optional. It will override the detected build command. For a monorepo, it will be executed at the root of the repository. In any other case, it will be executed wherever the WunderGraph directory is present. This will take precedence over the build command specified in your package.json file.

## Demo Project

We have prepared a demo project to show you how to configure your project. You can find it here: [cloud-multi-projects-demo](https://github.com/wundergraph/cloud-multi-projects-demo)
