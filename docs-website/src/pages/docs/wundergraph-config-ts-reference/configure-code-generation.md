---
title: Configure Code Generation
pageTitle: WunderGraph - Configure Code Generation
description:
---

This section describes how to configure code generation.
WunderGraph automatically generates clients, models, hooks definitions, and more for your application.
This way, configuration is always type-safe, and so is using the APIs.
You should never have to manually infer any types.

## Example Configuration

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  codeGenerators: [
    {
      templates: [...templates.typescript.all],
    },
  ],
});
```

This is the default configuration.
We're generating code with all typescript templates into the default directory,
which is `.wundergraph/generated`.

## Custom Configuration

In some instances, e.g. when using Next.js and React,
you might want to use a custom template and generate code into a custom directory.

Here's how you can do this:

```typescript
// wundergraph.config.ts

import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';

configureWunderGraphApplication({
  application: myApplication,
  server,
  operations,
  codeGenerators: [
    {
      templates: [...templates.typescript.all],
    },
    {
      templates: [new NextJsTemplate()],
      path: '../components/generated',
    },
  ],
});
```

As you can see, we're importing a custom template and initialize it.
We're also using the `path` property to specify the directory where the code will be generated.
