---
title: 'Workspace Configuration (wg.toml)'
pageTitle: WunderGraph - WunderGraph Cloud Workspace Configuration (wg.toml)
description: Configure your WunderGraph Cloud Project
---

Optionally, WunderGraph Cloud uses a `wg.toml` file to configure your cloud project. This file is located in the root of your repository.
You can configure multiple workspaces in a single repository. This is useful, if you have a monorepo with multiple WunderGraph projects. If you have a single workspace, you can skip this section and we will auto-detect your repository.
In the future, we might add more configuration options to this file.

> Note: If you are not familiar with writing TOML files, you can visit [https://toml.io/](https://toml.io/) to learn it.

```toml
# This is a TOML document to configure your Wundergraph workspaces.
# For more information, see https://docs.wundergraph.com/docs/cloud/configuration

version = 1

[projects]

# The key is the name of the project. It must be unique.
[projects.project1NameInCloud]
workspace = "/path/to/your/workspace"

[projects.project2NameInCloud]
workspace = "/path/to/your/workspace"
```

## Configuration Options

### version

The `version` field is optional. If you don't specify it, the latest version will be used.

### projects

The `projects` field is optional. It contains a list of projects. Each project has a name and a workspace path.
The name is used to identify the project in the WunderGraph Cloud CI. The workspace path is used to locate the project in the repository.

- `workspace` field is required. It contains the path to the workspace directory. The path is absolute to the root of the repository.
