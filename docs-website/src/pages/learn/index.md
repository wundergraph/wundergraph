---
title: 'Introduction'
tags: []
date: 2022-01-02
description: 'Learn how to use WunderGraph and get an understanding of the philosophy behind it by following the examples.'
layout: 'wg_by_example'
---

WunderGraph by Example is a series of hands-on tutorials that will not only teach you how to use WunderGraph,
but also give you an understanding of the philosophy behind it.

You can follow along the examples, or just read through all the articles to get a general understanding of WunderGraph.
Get started by clicking on the first article or by selecting one from the list.
In general, all articles build on each other, but you can also jump to any article if you're looking for a specific topic.

## Let's start with Why WunderGraph?

Before we start, let's take a look at why we built WunderGraph in the first place.

### What Problem Does WunderGraph Solve?

When building applications that depend on other services,
you have to lay the foundation to solve the following problems:

- How do I build a data access layer across multiple services?
- How do I authenticate users?
- How do I apply authorization across multiple services?
- How do I add external 3rd party APIs to my application?
- How do I handle file uploads?
- How do I add custom business logic before or after certain operations?
- How do I join data across multiple data sources?
- How do I integrate a 3rd party auth service?
- How should I handle caching?
- How do I handle realtime updates?
- How to do input validation?
- What about type-safety, code generation, and documentation?
- What security best practices should I follow?

All of this could also be summarized as: What's the best way to build a Backend for Frontend that's also acting as an API Gateway?
How do I handle all these cross-cutting concerns in a way that's easy to maintain and extend without too much boilerplate?

### How Does WunderGraph Solve These Problems?

API Gateways feel clunky and don't tie in well with the typical development workflow of keeping all the code in one place,
being able to easily run and test it locally, and having a single source of truth for the API layer.

Backends for Frontend (BFF) on the other hand are a great way to solve these problems,
but they are often too complex and require a lot of boilerplate code to get started.

So we've built WunderGraph, a combination of a Serverless API Gateway and the Backend for Frontend pattern.
It never feels like you're using a Gateway, but more like Firebase on Steroids.
Plug in all your services and APIs, and WunderGraph generates all the boilerplate code for you.

On top of that, we've got some strong opinions on how to build a BFF to make users of the framework more productive,
while at the same time making it easy to extend and customize.

One such convention is that everything is configured using TypeScript,
and you'll very rarely have to guess how to configure something.
Unlike other frameworks, you'll never have to write YAML or JSON files to configure WunderGraph.

## Build upon years of experience in building BFFs, API Gateways, and hundreds of edge cases by our users

Using WunderGraph, you'll be able to build your API layer on top of a solid foundation.
With years of experience in building BFFs and API Gateways,
we've seen a lot of edge cases by our users and have built solutions to handle the root cause and not just the symptoms.
With our main customer base being medium to large enterprises,
we've developed a strong understanding of how to build API Integrations at any scale.

With that in mind, let's get started!
