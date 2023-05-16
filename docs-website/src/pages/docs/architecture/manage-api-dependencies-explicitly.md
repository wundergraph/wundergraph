---
title: Manage API Dependencies explicitly
description: How WunderGraph allows you to manage API dependencies explicitly.
---

Most if not all applications treat API dependencies implicitly.
Actually, most developers have never thought about API dependencies explicitly.
At least I have never thought about API dependencies before building WunderGraph.

When we're building software, we rely on package manager for many years now.
It feels natural to use tools like npm, yarn, Gradle, Go Modules, etc...

Who in their right mind would manually include code-dependencies into their project?
Manually including code creates a lot of problems and doesn't scale.
You might be able to copy and paste a few files,
but not whole libraries.

Package manager also handle versioning and dependency management.
Bundlers are aware of the dependencies and can handle them.

So, why is it that we're not yet using a package manager for APIs?
Why don't we explicitly manage API dependencies?

The answer is portability.
APIs are not easily portable, let me explain.

## How we've invented Docker, but for APIs

As you might know, package managers are usually only capable of managing dependencies for a single language.
You can't just use npm for Go, or Gradle for Node.js.
That's why so many package managers are available for different languages.

If you want to build an API package manager,
you've got to be a lot more flexible.
You have to support REST APIs, GraphQL, SOAP, OData, AsyncAPI, Databases, etc...
There are so many ways to build APIs,
and simply building a package manager for REST APIs is not enough.

So, what other technologies can we use as a blueprint for building a package manager for APIs?

Docker is actually a really great starting point.
Docker divided the problem into two parts,
they've created a specification on how to build a Docker image,
and created a runtime that can run Docker images.

What started with Docker now turned into OCI, the Open Container Image format.
With this approach, it's possible to create images that can run on any runtime that implements the OCI specification.

You're probably aware of the ecosystem that is build on top of Docker and OCI.
Kubernetes is probably the most popular workload scheduler that's built on top of the specification.

So, what can we borrow from Docker and OCI?

### How Docker enabled portability

Docker made it possible to run containers on any platform.
If you can bundle an application as a Docker image,
you can run it anywhere where an OCI runtime is available.
Any big cloud provider offers Kubernetes and Docker/OCI as a service,
so you can run your applications anywhere you want.

### Applying the principle of Docker to APIs

To apply the same principle,
we've had to come up with a specification that makes APIs portable.

Our solution is to translate all the API dependencies of a project into a GraphQL Schema.
We call this composed GraphQL Schema the Virtual Graph.
As the name indicates, the Virtual Graph doesn't really exist,
and without adding a runtime, it would never be executable.

So, by itself, the Virtual Graph is very much useless.
But at least, we've got a way of describing all the capabilities of our API dependencies with a single language: GraphQL.

To make the Virtual Graph executable,
we have to add two more ingredients.
First, we have to create a runtime that can run the Virtual Graph.
Second, we have to generate a configuration that tells the runtime what to do.

Generating a GraphQL schema is not sufficient.
If you add fields to the Virtual Graph from multiple services,
you need to add metadata to the schema so that the engine understands how to resolve the fields.
E.g. one field might be backed by a REST API, another by a database,
a third one is a facade for Kafka.
Each of these fields might need a different set of configuration,
like database credentials, mTLS certificates, etc...

We could have added all of this to the GraphQL Schema,
[which we actually did try a few years ago](https://github.com/jensneuse/graphql-gateway/blob/master/schema.graphql).
However, we've quickly realized that this idea doesn't scale for two reasons.

For one, this schema quickly becomes unreadable.
Second, GraphQL Schemas are not as machine-readable as a simple JSON File.

With that, we've got our solution.
A runtime that implements various "backends" for the Virtual Graph,
GraphQL as a language to represent the Virtual Graph,
and a JSON configuration file that tells the runtime how to resolve the fields.

## How does this "Docker for APIs" work?

With this solution alone,
we're already able to do some cool magic.

Here's an example. Let's add two API dependencies to our project:

```typescript
// wundergraph.config.ts
const weather = introspect.graphql({
  apiNamespace: 'weather',
  url: 'https://weather-api.wundergraph.com/',
});

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});
```

Next, let's create an Operation:

```graphql
query (
  $continent: String!
  # the @internal directive removes the $capital variable from the public API
  # this means, the user can't set it manually
  # this variable is our JOIN key
  $capital: String! @internal
) {
  countries: countries_countries(filter: { continent: { eq: $continent } }) {
    code
    name
    # using the @export directive, we can export the value of the field `capital` into the JOIN key ($capital)
    capital @export(as: "capital")
    # the _join field returns the type Query!
    # it exists on every object type so you can everywhere in your Query documents
    # with the @transform directive, we can transform the response
    weather: _join @transform(get: "weather_getCityByName.weather") {
      # once we're inside the _join field, we can use the $capital variable to join the weather API
      weather_getCityByName(name: $capital) {
        weather {
          temperature {
            max
          }
          summary {
            title
            description
          }
        }
      }
    }
  }
}
```

If we now run `wunderctl up`,
we're able to get the weather for the capital of each country.

These two APIs are not meant to work together,
but with the approach described above,
we're able to make JOINs between them,
as if they were a single API.

But more importantly,
we're now explicitly managing our API dependencies.

How would you have done this without a package manager for APIs?
You'd probably just create two fetch requests for each API.
Imagine you're creating a project with hundreds of API dependencies,
each might have a different set of configuration,
secrets to manage, etc...

Is it convenient to manage the API dependencies manually?
What if you have to update or change a dependency?
Why is it ok to do this manually, while everybody automates this for sharing code?

## Running Docker locally is cool, but what about collaboration?

OK, Docker for APIs is really cool.
You get the point that portability is nice,
we're now explicitly aware of our API dependencies.
All secrets and credentials are managed in a single place.

But what about collaboration? Can we not just go one step further and make sharing API dependencies easy as well?

You might have guessed it,
but Docker for APIs was only the first step.

The logical second step is to create a registry where you can share your API dependencies with others.
We call this registry [WunderHub](https://hub.wundergraph.com/).

Docker did it for Images,
GitHub for code,
we're doing it for APIs.

Using `wunderctl`, an API provider can publish their APIs to WunderHub.

Keep in mind that it doesn't matter what kind of API you publish.
It can be a gRPC service, a REST API, GraphQL, or even a database.
Everything gets translated into the WunderGraph format, making it portable.

The API consumer can then use `wunderctl add` to add this dependency to their project.
Thanks to the portable runtime,
anybody can use any API that's published to WunderHub.

## Summary

And that's how we've invented Docker for APIs,
or the first package manager for APIs,
or however you want to call it.

We believe that making APIs portable and easy to share will enable better collaboration between API providers and consumers.
Making APIs portable, and easy to share is really just the beginning.
This new paradigm enables a whole new way of working with APIs and will allow us to create better workflows.
