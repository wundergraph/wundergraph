---
title: 'Private NPM Dependencies'
pageTitle: WunderGraph - Private NPM Dependencies
description: How to install private dependencies though npmrc
---

To install private dependecies, please commit your `.npmrc` or `.yarnrc.yml` files making sure all sensitive information like tokens are replaced by environment variables.

You need to provide any environment variables that these configuration files use with the prefix of `NPM_`.

```text {% filename=".npmrc" %}
registry=https://npm.pkg.github.com/org
//npm.pkg.github.com/:_authToken="${NPM_GH_TOKEN}"
```
