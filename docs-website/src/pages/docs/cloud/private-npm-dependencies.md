---
title: 'Private NPM Dependencies'
pageTitle: WunderGraph - Private NPM Dependencies
description: How to install private dependencies though npmrc
---

## Using .npmrc or .yarnrc files

In the case you do commit your .npmrc or .yarnrc files, WunderGraph picks it up automatically at the root of your project and installs all your private dependencies before building the project.

You need to provide any environment variables that these configuration files use with the prefix of `NPM_`.

```text {% filename=".npmrc" %}
registry=https://npm.pkg.github.com/org
//npm.pkg.github.com/:_authToken="${NPM_GH_TOKEN}"
```

## Using NPM_RC Environment Variable

Just for .npmrc, in the cases you do not commit it, place the contents of the .npmrc file in an environment variable named `NPM_RC`. We will dynamically generate the file during deployment to install private dependencies.
