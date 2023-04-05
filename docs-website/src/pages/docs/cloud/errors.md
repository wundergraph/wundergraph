---
title: 'Cloud Errors'
pageTitle: WunderGraph - Cloud Errors
description: Common errors and how to rectify them
---

This page contains a list of WunderGraph Cloud error codes, what they mean, and how to fix them.
In the case that your problem persists, we would be happy to assist you [on Discord](https://wundergraph.com/discord).

## CONFIG_NOT_FOUND

**Meaning**: No `wundergraph.config.ts` file was found in your project.  
**Why?**: Only WunderGraph applications can be deployed to WunderGraph Cloud.  
**Fix**: [Learn how to create a WunderGraph app (with common framework integrations)](docs/getting-started)

## PACKAGE_JSON_NOT_FOUND

**Meaning**: No `package.json` file was found in your project.  
**Why?**: The `package.json` stores necessary version information for your dependencies including WunderGraph.  
**Fix**: Make sure the `package.json` for your WunderGraph application was committed to your repository.

## PACKAGE_MANAGER_UNKNOWN

**Meaning**: No package manager was detected in your project, or your chosen package manager is currently unsupported.  
**Why?**: WunderGraph currently supports [npm](https://docs.npmjs.com/about-npm),
[yarn](https://yarnpkg.com/getting-started), or [pnpm](https://pnpm.io/installation).  
If you think we're missing support for a popular manager, please [contact us](https://wundergraph.com/discord).
**Fix**: Make sure you're using one of the following package managers: `npm`, `yarn`, or `pnpm`,
and that the relevant package manager files have been committed to the repository.

## ROOT_NOT_FOUND

**Meaning**: No WunderGraph project root was found in your project.  
**Why?**: The root for your WunderGraph project (path to the `package.json`) was not found.  
**Fix**: If you receive this error, please [contact us](https://wundergraph.com/discord).
