---
title: 'Redeployment'
pageTitle: WunderGraph Cloud - Project redeployment
description: How to redeploy your project to WunderGraph Cloud
---

All deployments (including redeployments) can be found in your deployed WunderGraph project's `Deployments` tab.
Each row in this tab represents a deployment (or redeployment) for the current Production Branch of your project.
The Production Branch is the project's link to a specific branch of the remote git repository.
You can change your project's Production Branch in the `Settings` tab of your project, under the secondary `Git` tab.

{% callout type="warning" %}
Changing your project's Production Branch will not automatically redeploy your project.
{% /callout %}

## Automatic redeployment (on Push)

When you push a commit to the production branch of your deployed project, WunderGraph Cloud will automatically
redeploy the project using that commit.

## Manual redeployment (Deployments tab)

### Top-level Redeploy button

This button will redeploy the latest commit for your project's _current_ Production Branch.

This is useful if:

1. You have changed your Production Branch since your project was last deployed
2. You have changed your project's Environment Variables

### Deployment row Redeploy menu button

Each row in the `Deployments` tab represents a deployment (or redeployment).
You can redeploy a specific deployment (typically a specific commit—the message of which can be seen in the row) by
clicking the three vertical dots.
This will open a new menu from which you can choose the `Redeploy` option.

### Success and failure

If your redeployment request was successful, you will receive a toast relaying success.
You should also see a new row representing the new deployment whose status will likely be "Building".
If the status changes to "Ready", your redeployment was fully successful.
If the status changes to "Failed", your redeployment was not successful.

If your redeployment request was unsuccessful, you will receive a toast relaying an error.
Please note that redeployment requests are limited to one per minute, and redeploying a failed build with no changes
will likely fail again.
