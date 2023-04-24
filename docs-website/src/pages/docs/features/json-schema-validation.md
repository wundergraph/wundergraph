---
title: JSON Schema Validation
pageTitle: WunderGraph - Features - JSON Schema Validation
description:
---

WunderGraph comes with JSON validation for inputs out of the box.
This is an extension to the existing type-safety that you're already getting from GraphQL.

GraphQL itself is only making sure that an input is a String or a number.
If you want to validate beyond that, which you definitely do,
you have to add additional validation logic somewhere.

With our JSON Schema extension,
you're able to add this logic right into the Operation Definitions.

This gives you a lot of flexibility while making sure your applications are secure.
We've implemented most of the available validation rules from this [ietf draft](https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-02#section-6).

Here's an example operation using the `@jsonSchema` directive:

```graphql
mutation (
  $message: String! @jsonSchema(title: "Message", description: "Write something meaningful", pattern: "^[a-zA-Z 0-9]+$")
) {
  createPost(message: $message) {
    id
    message
  }
}
```

In this case, we're configuring the title as well as description and set a Regex pattern for the input validation.
The equivalent JSON Schema for the input looks like this:

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "pattern": "^[a-zA-Z 0-9]+$",
      "title": "Message",
      "description": "Write something meaningful"
    }
  },
  "additionalProperties": false,
  "required": ["message"]
}
```

## More info in the reference

[The complete reference of available JSON Schema directives can be found here.](/docs/directives-reference/json-schema-directive)
