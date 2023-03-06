---
title: 'Custom Domains'
pageTitle: WunderGraph - Custom Domains
description: How to add custom domains to your deployment
---

By default, your WunderGraph Cloud project will immediately receive a dedicated subdomain upon deployment, i.e.,
`https://{your-project-name}.wundergraph.dev`.

If you wish to use your own domain, it is possible to add it to your deployment.
By default, each project may have up to three custom domains.
If you need more, please [contact us](https://wundergraph.com/discord).

# Adding a custom domain

Click your project and then click on the `Settings` tab.
On this screen, click on the menu item labeled `Custom domains`.

In the input field labeled `Domain`, enter your domain (without `https://`), for example, `mysubdomain.domain.com`.
If your domain was rejected, but you're certain that it was valid, [please let us know](https://wundergraph.com/discord).

The `Branch` dropdown is currently disabled while only one project environment is available per project.
This will be enabled in the future.

Click `Add`. You should see a loading icon, and a toast should report either success or failure.
In the case of failure, the message within the toast should explain the reason.
If you're experiencing continued trouble creating a domain, [please report it](https://wundergraph.com/discord).

After success, you will be able to see your custom domain within a list, and a (unverified) certificate for that domain
will be automatically added to your deployment.

# DNS configuration

Each custom domain list item contains a dropdown labeled `DNS configurations`.
Clicking this will display some CNAMEs and targets that you should enter into domain provider's DNS configuration.
You can use the copy button to add each item directly to your clipboard.

The first CNAME points your domain to the WunderGraph domain.

The second CNAME is for certificate verification.

You can find more specific domain provider instructions in the following sections.

## Verification

A certificate for your domain is produced automatically when you add the domain.
The UI will read either `unverified` or `pending`.
`Pending` means that the request for the certificate verification is currently in-flight.
Once the response arrives, it will change to `unverified` or `verified`.
Once you have added the DNS configurations correctly, the UI will display `verified`.
You can click the `Verify` button to check the status of your certificate at any time.

Certificates will expire after three months and should automatically reissue.

## Cloudflare

1. Go to [your dashboard](https://dash.cloudflare.com/)
1. Click your domain
1. Click DNS > Records
1. In the `DNS management for {domain}` UI, click `Add record`
1. Choose `CNAME` for the type.
1. Using the copy buttons in your deployment, paste the `CNAME` and `Target` into the respective boxes.
1. Toggle Proxy status to off (DNS only)
1. Save

There are reports that Cloudflare can interrupt the certificate verification process.
If you believe this is happening, try the following:

1. Click your domain
1. Click SSL/TLS > Overview
1. Check `Off (not secure)`

## Google Domains

1. Go to [Google Domains](https://domains.google/)
1. Click `My domains`
1. Click `Manage` next to your domain
1. Click `DNS` on the left side
1. Click `Manage custom records`
1. Using the copy buttons in your deployment, paste the `CNAME` and `Target` into the respective boxes.
1. Save

## GoDaddy

1. Go to [GoDaddy products](https://account.godaddy.com/products)
1. Click your domain
1. Click `Domain` on the left side
1. Click `Manage DNS`
1. Click `Add` on the `DNS-Records` panel
1. Using the copy buttons in your deployment, paste the `CNAME` and `Target` into the respective boxes.
1. Save

# Deleting a custom domain

You can delete a custom domain by clicking the `Delete` button.
You will then be asked to confirm the deletion.
Deleting the domain will also automatically delete the certificate associated with it.

When you delete your project, all associated domains and certificates will be deleted automatically.

# Troubleshooting

Even when everything is configured correctly, it can take up to 24 for DNS to propagate.

You can use the following command to test whether your domain is working reliably:

```shell
curl -H "Host: your-domain-here" https://{your-project-name}.wundergraph.dev
```

If your browser is displaying DNS errors, but `curl` returns the expected response, consider waiting up to 24 hours
before troubleshooting further.
