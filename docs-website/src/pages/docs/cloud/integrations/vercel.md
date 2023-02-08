---
title: 'WunderGraph and Vercel integration'
pageTitle: WunderGraph - Vercel integration
description: How to integrate WunderGraph with Vercel
---

How to integrate WunderGraph with Vercel.

{% callout title="This feature isn't publicly available yet." /%}

## How it works

The WunderGraph Vercel integration allows you sync your WunderGraph project settings with your Vercel projects.
This allows you to fully automate backend and frontend deployments. When the integration is enabled, WunderGraph will sync the public hostname of your API to your Vercel project.

## Installation

If you haven't imported your repository to Vercel yet, please do so first. You can find more information about that [here](https://vercel.com/docs/git-integrations).

Head over to your Vercel dashboard and click on the `Integrations` tab. Go to `Browse Marketplace` and Search for `WunderGraph` and click on the `Add integration` button.

Select the Vercel Account that you want to add the integration to and click `Continue.`. Choose All Project and select individual project that you want to give WunderGraph access to and continue.
Now you can verify the permissions that are given to WunderGraph and click `Add integration`, a popup opens that will redirect to WunderGraph.

Log in if you're not logged in yet.

Now you can select the Vercel project that you want to connect to your WunderGraph project and click `Connect Projects`. You will be redirected back to Vercel and the integration is now installed. 🥳

Now that the integration is installed, you can re-deploy your Vercel project so the configured environment variables are set.
