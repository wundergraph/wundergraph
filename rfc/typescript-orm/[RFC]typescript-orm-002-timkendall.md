# RFC - TypeScript ORM

This RFC describes support for the generation of a TypeScript ORM from the WunderGraph virtual graph. The goal of this proposal is to improve the DX (developer experience) of writing [WunderGraph functions](https://github.com/wundergraph/wundergraph/pull/515/).

_This proposal is the outcome of [the spike](https://github.com/wundergraph/wundergraph/pull/447/files#diff-573579a787c6e48b69054067480a1ff942374d328ed7c1ee5c77c3cead44f5ce) started by @jensneuse and further discussions with @timkendall_.

## Motivation

With the introduction of [WunderGraph functions](/docs-website/src/pages/docs/features/typescript-operations.md), users have the ability to define custom operations (i.e queries, mutations, and subscriptions) on the virtual graph. Importantly, **custom operations may make use of _existing data sources_** exposed on the WunderGraph virtual graph ([example](/testapps/nextjs/.wundergraph/operations/users/get.ts)).

To make use of existing data sources however, one must define a WunderGraph operation (i.e in `.wundergraph/operations`) with GraphQL SDL; this is not ideal for the following reasons:

1. **Operations must be defined in `./wundergraph/operations`** - introduces potential confusion for users as server-only operations (used to implement other operations) live alongside client operations
2. **Changes to operations require code generation to be rerun (either manually with `wunderctl generate` or automatically with `wunderctl up`)** - introduces friction in the development process, harming the developer experience

## Solution

This solution proposes to augment the existing [`InternalClient`](/packages/sdk/src/server/internal-client.ts) that is [code-generated](/packages/sdk/src/codegen/templates/typescript/internal.client.ts) from WunderGraph _operations_ with an additional one code-generated from WunderGraph _apis_. Users will be able to use this new client to construct WunderGraph operations via. a type-safe TypeScript API obviating the aforementioned limitations.

Importantly, while hand-written WunderGraph operations utilize GraphQL language syntax, the client will expose a higher-level API. As such we will omit some GraphQL features (such as named fragments and variables) that do not provide value in a server-side environment. We will also make some accommodations as-well in-this-regard (such as auto-selecting all scalar fields on an object and transparent namespacing)

Specifically, we will optimize the API for **single data source operations**, **single root field selections**, and **a simple and intuitive API**. Below we detail the proposed API and other consideration for this new TypeScript client.

1. [Namespacing](#namespacing)
2. [Root Parameterization & Default Selections](#root-parameterization--default-selections)
3. [Explicit & Nested Selections](#explicit--nested-selections)
4. [Nested Paramaterization](#nested-paramaterization)
5. [Abstract Types](#abstract-types)
6. [Multiple Root Selections](#multiple-root-selections)
7. [TypeScript Performance](#typescript-performance)

### Namespacing

In-order-to support WunderGraph [API namespacing](/docs-website/src/pages/docs/features/api-namespacing.md), namespaced API's will be accessible via. a `from(namespace: string): RootField` method on the client (non-namespaced API's will not require a `from` invocation). A namespace will return a `Root` object with `query`, `mutate`, and `subscribe` methods mapping to the associated GraphQL root types.

#### Example

1. Given the following schema

```graphql
type Query {
  # no namespace
  findFirstPost(
    where: PostWhereInput
    orderBy: [PostOrderByWithRelationInput]
    cursor: PostWhereUniqueInput
    take: Int
    skip: Int
    distinct: [PostScalarFieldEnum]
  ): Post

  # "jsp" namespace
  jsp_getPosts(tld: String!): [jsp_Post]

  # "weather" namespace
  weather_getCityById(config: weather_ConfigInput, id: [String!]): [weather_City]
}
```

2. And the following operations

```typescript
// no namespace (or the "default" namespace)
client.query('findFirstPost');

// "jsp" namespace
client.from('jsp').query('getPosts');

// "weather" namespace
client.from('weather').query('getCityById');
```

3. The following GraphQL operation will be generated

```graphql
{
  findFirstPost {
    # ... `Post` fields
  }
}
{
  jsp_getPosts {
    # ... `jsp_Post` fields
  }
}
{
  weather_getCityById {
    # ... `weather_City` fields
  }
}
```

### Root Parameterization & Default Selections

Root field paramaters will be accepted via. a `where` method invocation (required or not depending on data source schema). Additionally, in-order-to support what we think is the most common use-case, the client will by default select all scalar fields on a return type.

#### Example

1. Given the following schema

```graphql
type chinook_Album {
  AlbumId: Int!
  Title: String!
  ArtistId: Int!
  Artist: chinook_Artist!
  Track(
    where: chinook_TrackWhereInput
    orderBy: [chinook_TrackOrderByWithRelationInput]
    cursor: chinook_TrackWhereUniqueInput
    take: Int
    skip: Int
    distinct: [chinook_TrackScalarFieldEnum]
  ): [chinook_Track]
  _count: chinook_AlbumCountOutputType!
  _join: Query!
}
```

2. And the following operation

```typescript
const result = await client.from('chinook').query('findManyAlbum').where({ take: 5 });
```

3. The following GraphQL operation will be generated (notice all scalar fields are automatically selected on `chinook_Album`)

```graphql
{
  chinook_findManyAlbum(take: 5) {
    AlbumId
    Title
    ArtistId
  }
}
```

### Explicit & Nested Selections

The client will also support the slightly less common, though likely still fairly so, use case of explicit and nested selections.

#### Example

1. Given the following schema

```graphql
type chinook_Artist {
  ArtistId: Int!
  Name: String
  Album(
    where: chinook_AlbumWhereInput
    orderBy: [chinook_AlbumOrderByWithRelationInput]
    cursor: chinook_AlbumWhereUniqueInput
    take: Int
    skip: Int
    distinct: [chinook_AlbumScalarFieldEnum]
  ): [chinook_Album]
  _count: chinook_ArtistCountOutputType!
  _join: Query!
}
```

2. And the following operation

```typescript
const result = await client.from('chinook').query('findManyAlbum').select('Title', 'Artist', '_count.Album');
```

3. The following GraphQL operation will be generated (notice how all scalar fields are selected on `chinook_Artist`)

```graphql
{
  chinook_findManyAlbum {
    Title
    Artist {
      ArtistId
      Name
    }
    _count {
      Album
    }
  }
}
```

### Nested Paramaterization

Another common use-case the client will support is the parameterization of nested selections. This will be supported via. a `where(variables: VariablesFrom<Selection>): Field` method exposed on `Field` objects. A fictional `VariablesFrom` type will infer a `variables` object parameter from the selection previously created via a `select` invocation.

_Note: We will implement this such that required arguments, regardless of where they appear in a selection, will result in a type-error if `where` is not called._

#### Example

1. Given the following schema

```graphql
type chinook_Album {
  AlbumId: Int!
  Title: String!
  ArtistId: Int!
  Artist: chinook_Artist!
  Track(
    where: chinook_TrackWhereInput
    orderBy: [chinook_TrackOrderByWithRelationInput]
    cursor: chinook_TrackWhereUniqueInput
    take: Int
    skip: Int
    distinct: [chinook_TrackScalarFieldEnum]
  ): [chinook_Track]
  _count: chinook_AlbumCountOutputType!
  _join: Query!
}

type chinook_Track {
  TrackId: Int!
  Name: String!
  AlbumId: Int
  MediaTypeId: Int!
  GenreId: Int
  Composer: String
  Milliseconds: Int!
  String: Int
  UnitPrice: Float!
  Album: chinook_Album
  Genre: chinook_Genre
  MediaType: chinook_MediaType!
  InvoiceLine(
    where: chinook_InvoiceLineWhereInput
    orderBy: [chinook_InvoiceLineOrderByWithRelationInput]
    cursor: chinook_InvoiceLineWhereUniqueInput
    take: Int
    skip: Int
    distinct: [chinook_InvoiceLineScalarFieldEnum]
  ): [chinook_InvoiceLine]
  PlaylistTrack(
    where: chinook_PlaylistTrackWhereInput
    orderBy: [chinook_PlaylistTrackOrderByWithRelationInput]
    cursor: chinook_PlaylistTrackWhereUniqueInput
    take: Int
    skip: Int
    distinct: [chinook_PlaylistTrackScalarFieldEnum]
  ): [chinook_PlaylistTrack]
  _count: chinook_TrackCountOutputType!
  _join: Query!
}
```

2. And the following operation

```typescript
const result = await client
  .from('chinook')
  .query('findManyAlbum')
  .where({ take: 10 })
  .select('AlbumId', 'Title', 'Track', 'Track.InvoiceLine')
  .where({
    // parameterize the above selection
    Track: {
      take: 1,
      InvoiceLine: {
        // support for arbitrary levels of nesting
        take: 1,
      },
    },
  });
```

3. The following GraphQL operation will be generated (notice how `chinook_Track.Album`, `chinook_Track.Genere`, `chinook_InvoiceLine.Invoice`, and `chinook_InvoiceLine.Track` are not automatically selected since they are object types)

```graphql
{
  chinook_findManyAlbum(take: 10) {
    AlbumId
    Title
    Track(take: 1) {
      TrackId
      Name
      AlbumId
      MediaTypeId
      GenreId
      Composer
      Milliseconds
      String
      UnitPrice
      MediaType
      InvoiceLine(take: 1) {
        InvoiceLineId
        InvoiceId
        TrackId
        UnitPrice
        Quantity
      }
    }
  }
}
```

### Abstract Types

The final and likely least common use-case the client will support are selections on abstract types. This will be supported via. an `on(type: string): InlineFragment` method exposed on `Field<Abstract>` objects. The additional semantics will apply:

- A `__typename` field will _always_ be selected on abstract types (even if an `on` invocation is not supplied)
- Interface types will by default have all scalar fields selected (just like Object types)
- Abstract types present in nested selections can have their fields selected with additional `on` invocations

_WunderGraph's virtual graph supports abstract types (i.e [interfaces](https://graphql.org/learn/schema/#interfaces) and [unions](https://graphql.org/learn/schema/#union-types)) provided by supporting data sources (such as GraphQL data sources). The TypeScript client will offer type-safe support for these types._

Example:

```typescript
const result = await client
  .from('public')
  .query('gqlUnion')
  .where({ which: 'a' })
  .on('A') // provide selections for any occurences of type `A`
  .select('id', 'name')
  .on('B') // provide selections for any occurences of type `B`
  .select('id', 'name');
```

resulting in the following GraphQL operation:

```graphql
query {
  public_gqlUnion(which: a) {
    __typename # automatically selected by client
    ... on public_A {
      id
      name
    }
    ... on public_B {
      id
      name
    }
  }
}
```

### Multiple Root Selections

We will not support multiple root field selections (i.e on the root `Query`, `Mutation`, and `Subscription` types). We see this as a limited use-case that is not worth the added complexity. Additionally, the use-case can be accomplished via. constructing multiple individual root operations without "first-class" support in the API.

### TypeScript Performance

It is important that the client retains reasonable TypeScript language server (i.e IntelliSense) and compiler performance.

We are cautiously optimistic that the proposed namespacing of the WunderGraph virtual graph (i.e essentially partitioning TypeScript's work) will be sufficient to keep TypeScript compilation times reasonable.

If this turns out not to be the case, [additional performance tuning ](https://trpc.io/blog/typescript-performance-lessons) and/or changes to the client DSL will be required.

## Questions

Here are some questions that may help guide us towards a decision on the client DSL.

1. What level of abstraction do we want to expose (ex. expose GraphQL)?
2. What use-cases do we want to optimize for (ex. simple single data source queries)?
3. Are there additional WunderGraph functionalities we want to offer a "first-class" API for (for example [joining](/docs-website/src/pages/docs/core-concepts/_join-field.md) of data sources)?
4. What GraphQL functionality is reasonable to omit in-exchange-for API simplicity (i.e multi-field selection on root types, nested paramaterized fields, named fragments, client directives, etc.)?
