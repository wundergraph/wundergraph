---
title: Using Path Aliases
description: This guide explains how to use path aliases with WunderGraph
---

WunderGraph currently doesn't support tsconfig path aliases out of the box,
but there is a simple workaround using package.json subpath imports.

[Subpath imports](https://nodejs.org/api/packages.html#subpath-imports) allow you to configure private mappings that only apply to import specificiers from within the package itself. Entries in the `"imports"` field must always start with `#` to ensure they are disambiguated from external package specifiers.

## Configuration

To create an alias to the generated folder of WunderGraph, add the following to `package.json`.

```json
// package.json
{
  "imports": {
    "#/generated/*": "./.wundergraph/generated/*"
  }
}
```

Then to make sure the TypeScript compiler also supports this path, it needs to be added to `paths` in `tsconfig.json`.
Make sure you also configure the `baseUrl`.

```json
// tsconfig.json
{
  "compilerOptions": {
    // ... truncated
    "baseUrl": ".",
    "paths": {
      "#/generated/*": [".wundergraph/generated/*"]
    }
  }
}
```

Et voila, now you can import the generated code from this path alias.

```ts
import { createClient } from '#/generated/client';
```

If you are using a monorepo setup, you need to make sure to configure these paths in every package that require them.

## More info

- [Subpath imports](https://nodejs.org/api/packages.html#subpath-imports)
- [TSConfig paths](https://www.typescriptlang.org/tsconfig#paths)
