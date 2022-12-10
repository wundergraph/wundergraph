---
title: Usage Information
pageTitle: Usage Information
description: ''
hideTableOfContents: true
fullWidthContent: true
---

## Collected Usage Information

At WunderGraph, we are dedicated to delivering a top-notch solution that surpasses the expectations of our users and community. We are committed to continuously improving and enhancing WunderGraph. To achieve this, WunderGraph includes a feature that collects completely anonymous and non-sensitive data from all users. This data is aggregated and provides us with a better overall understanding of how WunderGraph is being used and interacted with.

## Why do we do this?

The number of developers using WunderGraph is growing constantly and due to this, we are committed to delivering the best possible experience for our users.

We are committed to our community and engaging in hands-on testing to understand and meet their needs. However, we also recognize the importance of collecting data to inform our development efforts. By collecting usage data, we can gain precious insights into how our platform is being used and we are better informed to make decisions about its future direction. This allows us to deliver the best possible experience for our users while also staying ahead of the curve in a rapidly evolving industry.

Usage data allows us to answer and make choices around these questions, without having to bother you :)

- What features are most popular among users and how are they being used?
- How long does it take for users to set up a project, and is an increase in installation time an indication of user difficulty or a complicated process?
- What errors are users encountering?
- What are the most commonly used Integrations?
- Should we prioritize compatibility with a specific version of Node.js based on usage among our community?
- What are the most commonly used data-sources?

## What is being collected?

- Command Invoked e.g. ( `wunderctl up`, `wunderctl generate`)
- Duration of e.g. `wunderctl up`
- Version of WunderGraph
- Anonymized User ID
- General machine information:
  - Operating System
  - CPU

> Note: This list is regularly audited to ensure its accuracy.

## What is an anonymized User ID?

We create a random ID on the first usage of WunderGraph and store it in `~/wundergraph.config.json`. We need this ID to be able to identify how many users are using WunderGraph and to be able to distinguish between different users in our analytics.
The ID is completely anonymous and does not contain any personal information.

You can view exactly what is being collected by setting the following environment variable: `WUNDER_TELEMETRY_DEBUG=true`. The data will be printed out to the stdout stream.

An example telemetry event looks like this:

```JSON
{
  "metrics": [{ "name": "WUNDERCTL_UP_CMD_USAGE" }],
  "clientInfo": {
    "osName": "LINUX",
    "cpuCount": 32,
    "wunderctlVersion": "dev",
    "anonymousID": "2Ie8ynG6f1hTKs3EVjItsy0DBcn"
  }
}
```

## What about Sensitive Data (e.g. Secrets)?

We do not collect any metrics which may contain sensitive data.

We take your privacy and our security very seriously. WunderGraph telemetry falls under the security disclosure policy.

## Will This Data Be Shared?

The data we collect is completely anonymous, not traceable to the source, and only meaningful in aggregate form.

No data we collect is personally identifiable.

## How Do I Opt-Out?

You may opt out-by running the wundergraph command with `--telemetry=false`:

`wunderctl up --telemetry=false`
