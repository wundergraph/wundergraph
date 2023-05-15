---
title: Generate SDKs for all your APIs
description: Use WunderGraph to generate SDKs for all your APIs
---

Imagine you've got to build a new product.
It needs a number of APIs,
so you decide to build a composition using the [Backend for Frontend (BFF)](/docs/use-cases/backend-for-frontend) approach.
To secure the BFF, you put an API Gateway in front of the BFF.

What usually happens is that either at the boundaries of the BFF,
or at the API Gateway layer,
we're dropping all the useful information about how the API works.

What I mean by this is that either the BFF,
or the API Gateway swallow all the information about the existing endpoints,
if authentication is required for an endpoint,
how to authenticate,
and what are the type definitions for the inputs and response objects.

The result of this is that it's not just complicated to keep the configuration of the BFF and API Gateway in sync,
but you also have to create the API client manually.

Adding new APIs to the BFF mean that you have to re-configure the Gateway,
but also have to add the new capabilities to the client.

Tools exist to automate this process,
but the results vary a lot,
and are complex to set up.

## What if we could generate SDKs by configuring the Gateway?

So we've asked ourselves the following question:

What if we merge the BFF and the Gateway together,
and generate an SDK based on the configuration of the BFF/Gateway?

And that's exactly what we're doing here.
You tell WunderGraph about your APIs and how you want to use them,
you configure the authentication provider,
and you can also add a file storage (s3).

WunderGraph then generates a BFF based on the operations you've defined.
We automatically configure authentication & authorization,
and we generate the client for you.

## An API client that's fully aware of the API capabilities

In our case,
we can leverage all the metadata available while generating the client.
We know about all the endpoints,
the input and response types.
We know if the user needs to be authenticated to run an operation or not.
We know how the client can authenticate the user,
e.g. by redirecting to the OpenID Connect provider and triggering the login flow.

We know all of this,
and use it to generate the smartest client possible.

Our code-generation framework is flexible,
extensible and open source.
So if you're not happy with the generated client,
you can easily create your own templates and generate code for any language you want.

Using the client feels like you're using a better version of Firebase,
just that you're able to connect it to your existing services.

## Summary

Existing solutions drop all the useful meta information which could make it easy to generate clients based on the API composition you've created.

With WunderGraph,
the API composition is used to generate a model of the API,
which is used to generate a client that is fully aware of the API capabilities.

The result is a client that feels like it's exposing a monolith,
while it's talking to multiple distributed services behind the scenes.
