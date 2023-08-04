---
title: 'Exclude Files from Deployments with .wundergraphignore'
pageTitle: WunderGraph - Exclude Files from Deployments
description: How to exclude files from being copied into the WunderGraph build.
---

# Introduction

The `.wundergraphignore` file can be used to exclude files from being copied into the WunderGraph build. This is useful if you have files that are not needed in the build, but are needed in the development environment.
This will reduce the size of the build and speed up the deployment process.

The `.wundergraphignore` file uses the same syntax as the `.gitignore` file. You can find more information about the syntax [here](https://git-scm.com/docs/gitignore).
The file must be placed in the root directory of your project and all paths are relative to the root directory.
