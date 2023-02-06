---
title: Manifesto
pageTitle: WunderGraph - Manifesto
description: ''
hideTableOfContents: true
fullWidthContent: true
---

This manifesto is a collection of principles that WunderGraph follows.
It outlines our understanding of the API-world and how we think about it.
Reading it will help you understand how we think and why we've created WunderGraph.

## Our understanding of the API world

### The number of APIs will grow exponentially

We believe in an API first world.
More and more teams are using APIs to enable new business and collaboration for other teams.
The same goes for companies in general.
In the long run, companies who offer their services through APIs will push companies out of the market who don't.

Open Banking is a great example of how a whole industry (fintech) evolved on top of APIs.
We'll see more standardization in other industries in the future,
leading to new waves of API usage.
Each new wave will enable new ways for businesses to collaborate.

### It's a challenge to create a successful API strategy

Just creating an API doesn't mean it's adding value to the world.

APIs need to be discoverable.
To make APIs discoverable, you have to document them.
Without good documentation, others will not be able to understand and use your APIs.
Where should you put this documentation?
What API style should you use?

You need to follow best practices for API design and implementation,
otherwise your API might be hard to use.
Your API needs to be secured.
You should have monitoring to understand your API consumers.

As you can see, there is a lot more than just implementing an API.

### There's a disconnect between API Management and Developers

A lot of existing API Management solutions are focused on operating existing APIs.
They assume that REST is the only real API style.
They assume that you've already got the perfect API design.

What they completely lack is a way of embedding API management into the software development lifecycle.
We keep talking about the "API Management lifecycle",
but the tools that we use are completely disconnected from how we develop software.

Here's an example: the typical way of building a Next.js app is to connect a git repository containing a Next.js application with Vercel.
On each commit on the main branch, the latest version gets deployed.
When you're opening a PR on a second branch, a preview environment gets deployed.
This preview can be reviewed manually, or tested with automated tests.
It's the ideal way to enable quick iteration.

Now look at how existing API Management solutions are implemented.
You cannot connect a project to the API management tool.
There's no concept of branches or previews.
Configuration doesn't live in git,
you have to configure the tool using a user interface.

This is a huge opportunity (for us) to disrupt the API Management industry.
API Management tries too hard to solve their own problems,
and forget to understand how it needs to blend into the rest of the stack.
We're here to change this.

### API Management solutions favor API producers over API consumers

When we talk about API Management,
what people usually mean is "API Gateways",
and that's a real problem.

A lot of API Management solutions are focused heavily on API producers,
and completely forget about the API consumers.

API Management shouldn't end at the API Gateway layer.
When exposing APIs through API Gateways,
there's a lot of useful information thrown away when it comes to API consumers.

If an API Gateway is aware of all the configured endpoints,
authentication methods, and other configuration,
why can't we automatically generate API clients that make it easy for API consumers to use the APIs?

If an API uses cookie-based authentication,
and we know that a user needs to be authenticated,
a generated client can be fully aware of this.
If we use OpenID Connect for authentication,
a generated client can offer a way to easily authenticate a user.

Yet, API Management solutions just don't care.
They focus on securing the API, and maybe adding a Developer Portal for discovery,
but the API consumer is on their own.
That's not how it should be.

### It's important to have variety in API styles

Some people think that GraphQL is the only way to go.
Some people think that it's the successor to REST.
The reality is, there's no right API style for every use case.

On top of that, it's important to have variety in API styles.
Variety helps us to continue to evolve APIs and make improvements.

GraphQL is probably the best that could have happened to REST,
as it helped developers to think more about the different tradeoffs between the two.

That said, variety in API styles is also a challenge,
as it makes centralized governance and management of APIs harder.

### Centralized Governance & Managing a heterogeneous set of APIs is a challenge

When there were only REST APIs, API Management was a lot simpler than it is today.
REST APIs have a dedicated endpoint for each Resource.

But what if you add gRPC to the mix?
RPC style APIs have different requirements.
gRPC is still HTTP-based, but it's a different protocol.
Building a unified API Management solution becomes a lot harder.

Add GraphQL to the mix, and the problems get worse.
GraphQL APIs usually only have a single endpoint,
so a monitoring solution for REST APIs will not generate meaningful results.

Next, we'd like to add event driven APIs to our tool belt,
with AsyncAPI, Kafka and the like.
At this point, we're no longer in the realm of HTTP-based APIs.
How should you manage these APIs with a single set of tools,
when the underlying protocols work completely different?

### The trend of niche API solutions turns the API Management landscape into a chaotic mess

Another problem we've seen is the proliferation of niche API solutions.
There's now a little startup for the simplest possible problem.

There are the big players in API Management,
who try to be everything to everyone.
Then there's companies who offer small solutions to specific use cases.
E.g. "Security for GraphQL APIs", "Developer Portals", "Monitoring", "Monitoring of GraphQL APIs",
"Sharing of gRPC APIs", and so on.

The big players are unable to build compelling solutions for all the different API styles.
The small players on the other hand create a whole new challenge.
To get the ideal solution,
you'd have to integrate several small solutions.
The drawback is that you can't easily integrate all of them.

The big problem with these small solutions is that they don't usually understand the big picture.
There's a company that offers a solution to make GraphQL APIs more secure.
If you follow one of our paradigms,
you'll realize that most companies should never expose their GraphQL APIs,
so you don't really need such a solution.

This is the result of inexperienced developers trying to build smart solutions without investing into research and learning the basics.
It's the same with advocating one API style over all the others.
There's a good reason we have variety in API styles.
If GraphQL is your solution to all problems,
that's probably because you're lacking experience.

### Thinking about APIs as dependencies is the first step of a new movement

When thinking about APIs,
I've realized that I've never seen APIs as dependencies,
and it was a big mistake.

It feels natural to think about npm packages and Go Modules as dependencies.
We use package managers, we install packages,
we version packages, we manage dependencies.
It's what we do as developers.

With APIs, we've never applied this principle.
We don't see APIs as artifacts that can be installed, managed and updated, just like dependencies.
That's a big mistake.

Throughout my career, I've never seen anybody thinking about APIs as dependencies.
Need to call an API from your backend? Use the fetch library, or an SDK and simply make an API call.
What sounds easy on day one turns into a mess over time.

You'll have implicit API dependencies scattered throughout your whole codebase.
Can you say at a glance what services your application depends on?
If not, you're not thinking explicitly about APIs as dependencies.
You're implicitly connecting services, and it's a mess.

Wouldn't it be beneficial if you could explicitly declare what services your application depends on?
That would be a lot more clear, and it would make it easier to understand what your application depends on.
Additionally, you'd get a single place to manage secrets and API credentials.

Imagine a service that depends on 10 REST APIs,
3 gRPC services, and 7 GraphQL microservices using Federation.

All these 20 services will evolve over time.
Could they introduce breaking changes?
Will they deprecate old APIs?
How will you communicate all that?
What's your process for keeping up to date with the latest changes?

Using a package manager like npm,
you could use semantic versioning and upgrade or replace dependencies continually.
With APIs, there seems to be no easy way to do it, doesn't it?

### Versioning APIs is an unsolved problem

Versioning APIs seems to be a solved problem, but it's not.
You can add a version to the URL, or maybe add a version Header,
but does it really solve the problem?

Instead of just adding versions of your APIs,
it would be better to think about how you can make APIs backwards compatible.
Don't put the burden of updating APIs on the API consumers.
You should make it easy for them, independent of the API style used.
Because that's another problem to solve.
What works for REST APIs in terms of versioning, is not applicable to GraphQL, gRPC or Kafka.

### API Gateways are not flexible enough, Backends for Frontends lack API Gateway capabilities

API Gateways work best when your use case is very basic, and you don't need to customize it.
The moment you need to add custom middleware, it usually gets super complicated.
You have to write plugins in Rust or Go, compile them on your own,
upload them to some service and manually add them into the middleware chain.
Testing is almost impossible.
Don't even think about debugging,
all you can do is add `console.log` statements to your code and see what happens.
That's not how software development works.

The reason for this is that API Gateways are not integrated well into the rest of the stack,
they are not part of your application.
You also don't usually use them during development, but also in production.
That's because they are not designed to run alongside the application in development.

Backends for frontends on the other hand give us all the flexibility we need,
but they lack critical features offered by API Gateways,
like authentication, authorization, API composition, and so on.

### Embedding authentication into your application causes huge problems

Another problem we see is when developers embed authentication into their applications.
What sounds like a good solution when starting a new project quickly turns into a liability.

It sounds so simple at first. Create a user table, add a login form, and you're done,
login works.
Next, you discover that you have to encrypt and salt passwords.
Are you rotating secrets?
Need to implement a password reset feature?
Add more custom code,
and now you have to manage a solution to send emails.
How to revoke access for a user?

Your solution grows and you need to add groups.
You need role management.
How do you structure the domain model?

As you can see, the simple table with a form quickly evolves into a complex solution.
At one day, you realize that you've re-invented OpenID Connect, or you don't.

So, why do developers think that they should build their own authentication implementation?
One reason is missing education.
The second one is that it's simply too hard to add OpenID Connect to your application.
Our goal is to make this as easy as possible,
helping you to separate concerns and make your application more secure.

### The evolution of GraphQL: from data-fetching to API composition

GraphQL is a very powerful query language.
When I first learned about GraphQL,
I thought that Fragments are the most powerful feature of GraphQL.
Fragments allow you to define reusable parts of your queries and attach them to user interface components.

As time went by, many of us realized that GraphQL is a great tool, but also comes with a cost.
One of the most popular clients, Relay, never got mass adoption, as it was just too hard to use.
So, outside of Facebook/Meta, the use of the Relay client seems small,
the same goes for Fragments.

While the Fragment approach is very powerful,
hoisting up data requirements from the ui components,
most developers seem to like a simpler approach,
defining data requirements top-down,
without using Fragments.

The impact of Fragments seem to fade,
but another feature of GraphQL is starting to play a major role for API composition & integration.

> The SelectionSet is the enabler for a new wave of API composition patterns

Another feature of GraphQL excites me even more than Fragments,
I'm speaking about the SelectionSet.
The SelectionSet sets GraphQL apart from other API styles because it allows API consumers to limit the data they receive.
With gRPC, REST, and similar API styles,
the server always returns the full object to the client.
With GraphQL, based on the fields defined in the SelectionSet,
the client can only receive the data it needs.

If you're familiar with GraphQL already,
you might know that this is one of the main selling points of GraphQL,
especially when it comes to binding APIs to user interfaces.
It's a requirement to send as little data as possible to the client,
so the SelectionSet plays a big role here.

So, why is the SelectionSet relevant for API composition?

Imagine a large company with hundreds of microservices would start to compose their APIs into a Graph.

If they were using a technology like gRPC, you'd always return the full object to the client.
Depending on the relationships, depth of the relationships, and the amount of data,
you might end up with a very large response.
With possible circular dependencies,
you might actually never get a response at all.

Another choice could be to use REST APIs as a "meta" API.
With REST, you would run into the same problem as with gRPC.
But there's a better way to model relationships in REST APIs,
you can use links in the response to point to other resources.
This would allow the API to scale,
but put the burden of "following" the links on the client.

With GraphQL and the SelectionSet feature,
you can map out the whole API with a single GraphQL Schema.
If a client wants to follow a relationship,
they simply select another field.
The burden of following the links, in this case,
is on the server, making it a lot easier to use compared to REST APIs.

I'm not the only one excited about GraphQL and API composition.
In fact, there's even a [working group](https://github.com/graphql/composite-schemas-wg) from the GraphQL foundation that recently started working on the topic.
Companies like Graphile, The Guild, Stellate, American Express, Amazon, Kensho, Apollo, Meta, Netflix, Tyk, Microsoft, StepZen, Intuit, IBM, WunderGraph and Unity are collaborating...

> To build a specification that covers many of the shared concerns when building a larger GraphQL schema as a composite of many smaller GraphQL schemas.

I'm super bullish that through these efforts,
GraphQL will become the dominant API style to compose APIs.
The query language is a great fit to solve this problem and companies heavily invest into the ecosystem.

## How we're solving these problems

Now that we've outlined our understanding of the API ecosystem and the problems we see,
we'll discuss how we're tackling these problems.

### The meta-API-style to make APIs portable

Our solution to make APIs portable is to create a "meta-API-style" that can be used to compose APIs.
As the language for API composition,
we're using GraphQL.

As described above, GraphQL is ideal for API composition because of the SelectionSet feature.
Relationships are very easy to represent, even circular ones,
and the SelectionSet makes for an easy way to "query" them.

As for the transport, we're using JSON RPC over HTTP.
It's much more secure and performant than traditional GraphQL implementations.

### Universal API Management for all API styles

By introducing a meta-API-style,
we're able to offer the full bandwidth of API Management capabilities,
like authentication, authorization, monitoring, logging, and so on across all API styles.
You can define security policies with one single pattern, independent if you're using gRPC, REST, GraphQL or Kafka.

### We're building on open standards

All of this is possible without inventing a new language,
but instead build on top of existing standards.

For authentication, we're integrating with OpenID Connect.
We use OAuth2 for authentication, S3 for files,
and GraphQL for the meta-API-style.

For introspecting existing services,
we leverage existing specifications like OpenAPI, GraphQL, Apollo Federation, protobuf, AsyncAPI and more.

### Configuration as code

Another principle of ours is that all configuration is done as code.
There's no buttons to click, no forms to fill out.
Security policies are not checkboxes or radio buttons,
but rather functions of code that can be tested.

The configuration of the API Gateway is part of your codebase,
instead of separating the two.
Changing some code that also affects the API Gateway?
It can all happen in one place,
and you're able to make the changes with a single PR.

Rolling back (or reverting) the changes is as easy as reverting the Pull Request (PR).
Following this principle also allows for great collaboration.
You can propose changes in a PR and your colleagues can review them before deploying.

### GitOps / Continuous Integration & Delivery / Git driven development

Driving infrastructure, like API Gateway configurations, through code enables us to use GitOps.
This means that we can use CI/CD to deploy our infrastructure.

When we're about to make a change,
we can create a new branch.
Once the branch is ready to be reviewed,
we can open a Pull Request.

By opening a PR, a git bot can validate the changes and deploy a preview environment.
This preview environment can run in a sandbox,
and be used for manual or automated testing.

### Applying the principles of Docker to APIs

Docker made applications portable.
By applying the same principle to APIs,
we can make them as portable as Docker containers,
independent of the underlying API style.

### A package manager for APIs

Portable APIs enable a new way to think about APIs.
Unifying the different API styles into a single, unified, language (GraphQL) allowed us to create a package manager for APIs.

When a REST API behaves the same as an AsyncAPI, implemented with Kafka,
we can "install" both APIs into our project using a package manager.

A package manager, combined with a registry, enables teams to collaborate on APIs in whole new ways.

### GraphQL as the language for universal API composition & integration

We've decided to use GraphQL as the language for API composition and integration.
GraphQL is perfect as the meta-API-language,
because it can easily represent relationships between APIs.

In a composed GraphQL schema,
you can build relationships between multiple microservices.
GraphQL allows clients to easily query these relationships without having to know anything about the underlying API styles.

The WunderGraph API Gateway trangrays between GraphQL and the underlying technologies behind the scenes.
Just like the Docker runtime made applications portable,
the WunderGraph API Gateway acts as an abstraction between GraphQL schema (frontend) and API implementation (backend).

### GraphQL to JSON RPC Compiler

This abstraction is achieved through our invention,
the GraphQL to JSON RPC Compiler.

We've realized that the complexity of having to be able to convert between and compose APIs is actually a compiler problem.
With GraphQL as the frontend, and various "adapters" as the compiler backend.

GraphQL itself comes with challenges regarding security and performance, when used in the traditional way.
Instead of implementing a GraphQL Runtime / Interpreter,
we've implemented a GraphQL Compiler.
This removes GraphQL from the runtime,
without giving up on the great Developer Experience of the Query Language.

### Managing API dependencies explicitly

Combining the ideas of a meta-API-style with a package manager and registry allows us to re-think our understanding of APIs.
The big difference is that we can now manage dependencies explicitly.

Calling APIs directly from your code, e.g. using fetch, creates not just a lot of point-to-point integrations.
It's also making the dependencies between services quite intransparent.

Instead, we're proposing to publish APIs as packages into a registry.
This allows us to manage dependencies explicitly.
Need access to a service?
You can simply install the package.

What this also means is that the lifecycle of an API becomes a lot easier to handle.
When there's a new version of an API,
the package manager can automatically notify the users of the new version.

Semantic Versioning helps to distinguish between breaking changes,
minor additions and patches.

### Merging the API Gateway pattern with the Backend for Frontend pattern

The Backend for Frontend (BFF) pattern is such a powerful pattern,
but also expensive to implement and maintain.

With WunderGraph, we're merging the BFF pattern with the API Gateway pattern.
Actually, you don't even have to write any code to create a BFF.
It's all generated and integrated with the API Gateway.

### The Evolution of the Client-Server Architecture

The Client-Server Architecture is one of the most important pillars of web development.

With WunderGraph, we're iterating on this pattern, making it more powerful than ever.
A pure client-server model requires too many interactions,
e.g. if you're using a REST API.

With WunderGraph, we're going a hybrid approach,
where we're moving some parts of the client to the server.
This way, client and server can communicate over an efficient RPC protocol,
only exchanging the data they need.

Additionally, by moving some parts of the client to the server,
the client is much more lightweight.
The server has much more powerful resources and can apply caching much more efficiently than the client.

### Making the API Gateway part of the application

The key to making the above possible is to make the API Gateway part of the application.
The client and API Gateway build a unit.
They work perfectly hand-in-hand as they are generated from the same configuration.
It's like building an engine and the gearbox in a single unit.
There's no friction between the two, and they fit together perfectly.

Most clients are generated independently of the API,
not to mention the API Gateway,
which is usually a completely separate unit.
With WunderGraph, you can define your API dependencies explicitly,
and both API Gateway and client will be molded as a single piece.

## The road ahead of us

We've really just started the journey of building the next generation of API layer.

Our goal is to support developers through the whole lifecycle of APIs,
from design, to implementation and deployment.
We want to enable new ways of collaborative work between API providers and consumers.

We believe that API first is the best way to build and scale your business.
We want to help companies to embark on this journey,
generating new opportunities through API collaboration.

With each new API made available to others,
a new use case becomes possible,
that again will lead to new opportunities for businesses to collaborate using APIs.
