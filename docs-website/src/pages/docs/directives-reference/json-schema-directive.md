---
title: '@jsonSchema Directive'
description: Configure a JSON Schema for the variables of an Operation.
---

The `@jsonSchema` directive can be used to configure a JSON Schema for the variables of an Operation.
This JSON Schema is not only good for input validation, it's also useful for code generation.
For example, it's possible to generate a complete type-safe client including forms, just by writing a GraphQL Operation.

This example shows all available arguments for the directive,
we'll then break them down, one by one.

```graphql
mutation (
  $message: String!
    @jsonSchema(
      title: "Message"
      description: "Describe the message"
      pattern: "^[a-zA-Z 0-9]+$"
      commonPattern: EMAIL
      commonPattern: DOMAIN
      minLength: 3
      maxLength: 5
      minimum: 1
      maximum: 1
      exclusiveMaximum: 2
      exclusiveMinimum: 2
      maxItems: 1
      minItems: 1
      multipleOf: 1
      uniqueItems: true
    )
) {
  createPost(message: $message) {
    id
    message
  }
}
```

## title & description

The value of both of these keywords MUST be a string.

Both of these keywords can be used to decorate a user interface with
information about the data produced by this user interface. A title
will preferably be short, whereas a description will provide
explanation about the purpose of the instance described by this
schema.

## pattern

The value of this keyword MUST be a string. This string SHOULD be a
valid regular expression, according to the ECMA 262 regular
expression dialect.

A string instance is considered valid if the regular expression
matches the instance successfully. Recall: regular expressions are
not implicitly anchored.

## commonPattern

The value of this keyword MUST be one of: EMAIL, DOMAIN

A string instance is considered valid if the regular expression of the common pattern
matches the instance successfully.

## minLength

The value of this keyword MUST be a non-negative integer.

A string instance is valid against this keyword if its length is
greater than, or equal to, the value of this keyword.

The length of a string instance is defined as the number of its
characters as defined by RFC 7159 [RFC7159].

Omitting this keyword has the same behavior as a value of 0.

## maxLength

The value of this keyword MUST be a non-negative integer.

A string instance is valid against this keyword if its length is less
than, or equal to, the value of this keyword.

The length of a string instance is defined as the number of its
characters as defined by RFC 7159 [RFC7159].

## minimum

The value of "minimum" MUST be a number, representing an inclusive
lower limit for a numeric instance.

If the instance is a number, then this keyword validates only if the
instance is greater than or exactly equal to "minimum".

## maxium

The value of "maximum" MUST be a number, representing an inclusive
upper limit for a numeric instance.

If the instance is a number, then this keyword validates only if the
instance is less than or exactly equal to "maximum".

## exclusiveMinimum

The value of "exclusiveMinimum" MUST be number, representing an
exclusive lower limit for a numeric instance.

If the instance is a number, then the instance is valid only if it
has a value strictly greater than (not equal to) "exclusiveMinimum".

## exclusiveMaximum

The value of "exclusiveMaximum" MUST be number, representing an
exclusive upper limit for a numeric instance.

If the instance is a number, then the instance is valid only if it
has a value strictly less than (not equal to) "exclusiveMaximum".

## minItems

The value of this keyword MUST be a non-negative integer.

An array instance is valid against "minItems" if its size is greater
than, or equal to, the value of this keyword.

Omitting this keyword has the same behavior as a value of 0.

## maxItems

The value of this keyword MUST be a non-negative integer.

An array instance is valid against "maxItems" if its size is less
than, or equal to, the value of this keyword.

## multipleOf

The value of "multipleOf" MUST be a number, strictly greater than 0.

A numeric instance is valid only if division by this keyword's value
results in an integer.

## uniqueItems

The value of this keyword MUST be a boolean.

If this keyword has boolean value false, the instance validates
successfully. If it has boolean value true, the instance validates
successfully if all of its elements are unique.

Omitting this keyword has the same behavior as a value of false.

## Setting the JSON schema for a field

`@jsonSchema` accepts an optional `on:` argument that might be used to set the JSON schema for an
specific field. Given the following type:

```graphql
input createUserInput {
  id: String!
  email: String!
  name: String!
}
```

We can use `@jsonSchema` to set the JSON schema of `id` using:

```graphql
mutation ($input: createUserInput! @jsonSchema(pattern: "[0-9]+", on: "id")) {
  users_Create($input) {
    id
    email
    name
  }
}
```

## Validating multiple values

`@jsonSchema` can be used multiple times on the same operation, validating data for different fields.
Additionally, `@jsonSchema` can be combined with other directives for injecting or manipulating data
like `@fromClaim`, `@injectCurrentDateTime`, `@injectEnvironmentVariable` and `@injectGeneratedUUID`.
