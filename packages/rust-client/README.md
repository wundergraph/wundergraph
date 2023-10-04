# Rust Client for WunderGraph

This package implements a code generator that produces a Rust client library to
communicate with your WunderGraph application.

To enable it, add its generator to your WunderGraph application.

```typescript

import { rustClient } from '@wundergraph/rust-client';
...

configureWunderGraphApplication({
    ...
    generate: {
        codeGenerators: [
            ...
            {
                templates: rustClient(),
                path: '../rust/client',
            },
	],
    },
    ...
});
```

This will generate a Rust package at `$WUNDERGRAPH_DIR/../rust/client` the next time you
run `wunderctl generate`.

## Optional configuration

The Rust client generator supports the following configuration options:

- `packageName`: Package name for the generated client package
- `packageVersion`: Package version for the generated client package
