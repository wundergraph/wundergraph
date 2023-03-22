---
title: Deploy Button
pageTitle: WunderGraph - Deploy Button
description: Deploy public Git projects to WunderGraph Cloud with the Deploy Button.
---

Deploy public Git projects to WunderGraph Cloud with the Deploy Button. The Deploy Button allows users to create a new project in WunderGraph Cloud by cloning a public Git repository.

{% deploy template="nextjs" /%}

## Generate a Deploy Button

To generate a Deploy Button, you need to provide the URL of the Git repository to clone. The URL must be a valid Git URL and must be publicly accessible.

{% deploy-button-generator /%}

## Support parameters

| Parameter     | Value                                  | Type   |
| ------------- | -------------------------------------- | ------ |
| repositoryUrl | The URL of the Git repository to clone | string |
