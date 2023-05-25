---
title: 'Private NPM Dependencies'
pageTitle: WunderGraph - Private NPM Dependencies
description: How to install private dependencies though npmrc
---

## Using .npmrc file

In the case you do commit your .npmrc file, WunderGraph picks it up automatically at the root of your project and installs all your private dependencies before building the project.

## Using NPM_RC Environment Variable

The .npmrc file may contain sensitive tokens which should not be part of your version control. In such cases, place the contents of the .npmrc file in an environment variable named `NPM_RC`. We will dynamically generate the .npmrc file during deployment to install private dependencies.
