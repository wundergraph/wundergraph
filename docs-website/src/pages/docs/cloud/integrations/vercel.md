---
title: 'WunderGraph and Vercel integration'
pageTitle: WunderGraph - Vercel integration
description: How to integrate WunderGraph with Vercel
---

How to integrate WunderGraph with Vercel.

## How it works

The WunderGraph Vercel integration allows you to sync your WunderGraph project settings with your Vercel projects.
This allows you to fully automate backend and frontend deployments. When the integration is enabled, WunderGraph will sync the public hostname of your API to your Vercel project.

## Installation

If you haven't imported your repository to Vercel yet, please do so first. You can find more information about that [here](https://vercel.com/docs/git-integrations).

Head over to your Vercel dashboard and click on the `Integrations` tab. Go to `Browse Marketplace`, search for `WunderGraph` and click on the `Add integration` button.

Select the Vercel Account to which you wish to integrate and click `Continue.`. Choose `All Projects` or select an individual project that you want to give WunderGraph access to and click `Continue`.
Now you can verify the permissions that are given to WunderGraph and click `Add integration`. A popup will open that will redirect to WunderGraph.

Log in if you're not already logged in.

Now you can select the Vercel project that you want to connect to your WunderGraph project and click `Connect Projects`. You will be redirected back to Vercel. The integration is now installed. 🥳

Now that the integration is installed, you can re-deploy your Vercel project so the configured environment variables are set.
