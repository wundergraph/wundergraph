---
title: API Management
description: Managing APIs is the classic use case supported by WunderGraph.
---

Managing APIs is the classic use case supported by WunderGraph.

What is usually meant by API Management is to set up an API Gateway to handle cross-cutting concerns,
like security, authentication, authorization, logging, and so on.

Other aspects of API Management are to be able to define security policies,
to manage the lifecycle of APIs,
versioning,
and to manage the lifecycle of API Clients.

## Gateway-less API Management with WunderGraph

What sets WunderGraph apart from other tools is that we embrace the idea of "Gateway-less" API Management.

Gateway-less doesn't mean that we're not using a Gateway,
but it means that developers don't have to reason about the Gateway.

WunderGraph comes with a powerful TypeScript SDK to configure all concerns of managing APIs.
A lot of other tools break the workflow of Developers by forcing them to use "Gateway-full" tools.

Gateway-full in this context means that the Gateway is not really a part of the application.
It's a separate service that, once the application is implemented,
gets put in front of the application and needs to be configured and tested separately.

Configuration of API Gateways usually works using some Dashboard, cli, or even APIs.
All of these methods break with the development workflow of Developers,
because the "API Management" aspects are not really part of the application.

With our architecture and the WunderGraph SDK,
we're completely changing this.

You configure authentication, authorization, custom middleware, etc... simply by writing code.
This code is part of your application and updates the API Gateway automatically behind the scenes.
Moreover, even during development,
the API Gateway is already part of the stack,
so you're using the gateway from the first line of code of your application.
There's almost no difference between running your application locally or in production.

Instead of creating security policies using point and click,
you can define all of this using code.
This is not just super convenient,
but it also comes with versioning out of the box.
Made a mistake? You'll probably see in a preview environment.
If it slipped through, you can easily switch back to another commit.

All of this is fully integrated into frontend frameworks,
like Next.js or React.

Most API Management tools are dedicated to operations people.
WunderGraph is a tool for developers.
