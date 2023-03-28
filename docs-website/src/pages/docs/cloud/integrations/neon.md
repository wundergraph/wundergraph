---
title: 'WunderGraph and Neon integration'
pageTitle: WunderGraph - Neon integration
description: How to integrate WunderGraph with Neon
---

How to integrate WunderGraph with Neon.

## How it works

The Neon integration allows you to sync your Neon database settings with your WunderGraph projects.
This integration sets the connection string of your neon database allowing the wundernode to perform operations on it. Do note that any changes made to the connection string on the neon dashboard are not automatically synced.

## Installation

Navigate to the settings page of your desired WunderGraph project, click on the `Integrations` tab and click on the `Connect Neon` button.

Now you will be directed to Neon. You can verify the permissions that are given to WunderGraph and click `Authorize`.

You will then be redirected back to WunderGraph. If you are a part of multiple organizations, you will be asked to select the organization to which you want to connect with Neon. Click on `Next`.

Select the Neon project that you want to connect to your WunderGraph project and click `Connect Projects`.

The integration is now installed. 🥳

Now that the integration is installed, you can re-deploy your WunderGraph project so the configured environment variables are set.

## Important Instructions

1. WunderGraph creates a role in the Neon project selected during the integration process, please do not delete or change the password of the role.
2. WunderGraph will be setting a environment variable called `NEON_DATABASE_URL`. Please use this env wherever you need the database url.
