---
title: Usage Information
pageTitle: Usage Information
description: ''
hideTableOfContents: true
fullWidthContent: true
---

# Collected Usage Information

At WunderGraph, we are dedicated to delivering a top-notch solution that surpasses the expectations of our users and community. We are committed to continuously improving and enhancing WunderGraph. To achieve this, WunderGraph includes a feature that collects completely anonymous and non-sensitive data from all users. This data is aggregated and provides us with a better overall understanding of how WunderGraph is being used and interacted with.

## Why do we do this?

The number of developers using WunderGraph is growing exponentially and due to this, we are committed to delivering the best possible experience for our users.

We are committed to our community and engaging in hands-on testing to understand and meet their needs. However, we also recognize the importance of collecting data to inform our development efforts. By collecting usage data, we can gain precious insights into how our platform is being used and we are better informed to make decisions about its future direction. This allows us to deliver the best possible experience for our users while also staying ahead of the curve in a rapidly evolving industry.

Usage data allows us to answer and make choices around these questions, without having to bother you :)

- What features are most popular among users and how are they being used?
- How long does it take for users to set up a project, and is an increase in installation time an indication of user difficulty or a complicated process?
- What errors are users encountering?
- What are the most commonly used Integrations?
- Should we prioritize compatibility with a specific version of Node.js based on usage among our community?
- What are the most commonly used plugins?

# What is being collected?

- Command Invoked ( `wunderctl up, wunderctl generate)
- Version of WunderGraph
- General machine information (OS)
- Which plugins are present in your project
- Duration of `wunderctl up` and size of application(total number of operations)

You can view exactly what is being collected by setting the following environment variable: WUNDER_TELEMETRY_DEBUG=1. When this environment variable is set, data will not be sent to us. The data will only be printed out to the stderr stream, prefixed with [telemetry].

An example telemetry event looks like this:

```JSON
{
  "eventName": "WUNDER_VERSION",
  "payload": {
    "version": "1.0.5",
    "isDevelopment": false
  }
}
```

#What about Sensitive Data (e.g. Secrets)?

We do not collect any metrics which may contain sensitive data.

We take your privacy and our security very seriously. Next.js telemetry falls under the security disclosure policy.

#Will This Data Be Shared?

The data we collect is completely anonymous, not traceable to the source, and only meaningful in aggregate form.

No data we collect is personally identifiable.

#How Do I Opt-Out?

You may opt out-by running wunder telemetry disable in the root of your project directory:

`px wunder telemetry disable`

# Or

`yarn wunder telemetry disable`

You may check the status of telemetry collection at any time by running next telemetry status in the root of your project directory:

npx wunder telemetry status

# Or

yarn wunder telemetry status

You may re-enable telemetry if you'd like to re-join the program by running the following in the root of your project directory:

npx wunder telemetry enable

# Or

yarn wunder telemetry enable

You may also opt-out by setting an environment variable: WUNDER_TELEMETRY_DISABLED=1.
