---
title: Bundle the generated client for distribution
description: This guide shows how to bundle the generated client for distribution to other teams, repositories or NPM.
---

There are situations where you want to share the generated client across teams, different repositories, or distribute it via NPM. This guide shows how to bundle the generated client into a single file that can be published to NPM, Github Packages or a private package registry.

Since the generated client depends on dynamic types for TypeScript operations, it's not possible to publish it as a library. Instead, we need to bundle the generated client so that it includes all (static) TypeScript types. In this guide we will use [TSUP](https://tsup.egoist.dev/) for bundling, it uses ESBuild under the hood and is very fast.

## Prerequisites

This guide assumes you already have an existing WunderGraph project inside a monorepo. If you don't have a WunderGraph project yet, you can follow the [Getting Started](/docs/getting-started) guide to create a new project.

There's an example repository available on [GitHub](https://github.com/wundergraph/publish-client).

## Setup

The first thing we need to do is to create a new client package inside the monorepo.

Create a new `client` folder inside your `packages` folder (or any other folder you prefer, that is configured as a workspace) and add a `package.json` file with the following content:

```json
{
  "name": "@my-org/client",
  "version": "1.0.0",
  "description": "WunderGraph client",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup"
  },
  "dependencies": {
    "@wundergraph/sdk": "^0.149.1"
  },
  "devDependencies": {
    "tsup": "^6.7.0",
    "zod": "^3.22.3"
  }
}
```

Zod is required to build TypeScript operation endpoints for the client.

Next we need a `tsconfig.json` file in the `client` folder:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "commonjs",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["zod"]
  },
  "include": ["../../gateway/.wundergraph/**/*.ts"]
}
```

The `include` path points to the the `.wundergraph` folder, where the generated client code is located. It's also required to add the `zod` type to the `types` array of the `compilerOptions`.

The last thing we need to do is to add a `tsup.config.ts` file to the `client` folder:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['../../gateway/.wundergraph/generated/client.ts'],
  splitting: false,
  bundle: true,
  clean: true,
  dts: true,
  outDir: 'dist',
  format: ['cjs', 'esm'],
});
```

- `entry` points to the generated client code in our gateway.
- `splitting` is disabled because we want to bundle everything into a single file.
- `bundle` is enabled to bundle all imports except dependencies into a single file, this is required so TypeScript operations types are included in the bundle.
- `clean` is enabled to remove the `dist` folder before building.
- `dts` is enabled to generate type definitions.
- `outDir` is set to `dist` to output the bundled code into the `dist` folder
- `format` is set to `cjs` and `esm` to generate CommonJS and ES Modules. Currently the WunderGraph SDK only supports CommonJS, but we plan to support ES Modules in the future.

Now we're almost set, the last thing to do is add a new build script to the workspace root `package.json` that will run the WunderGraph code generation and build the client:

```json
{
  "scripts": {
    "generate": "pnpm run --filter gateway generate",
    "build": "WG_PUBLIC_NODE_URL=https://api.my.org pnpm generate && pnpm build:client",
    "build:client": "pnpm run --filter @my-org/client build",
    "publish:client": "pnpm run --filter @my-org/client publish"
  }
}
```

The `WG_PUBLIC_NODE_URL` is the URL of the WunderGraph gateway that will be used to generate the client code. It defaults to `http://localhost:9991` if not set. You can also set it in a `.env` file. You should configure it to point to the production gateway URL in your CI/CD pipeline.

Now we're ready to build the client:

```bash
pnpm build
```

After building the client, it's ready to be shared with other teams, repositories or published to NPM.

In case your backend and frontend teams work in the same repository, but you want to use static typing for the frontend, you can also add the `@my-org/client` package as a dependency to the frontend workspace and import the generated client from there.

```ts
// inside the frontend workspace
import { createClient } from '@my-org/client';

export const client = createClient();
```

### Distribute the client

If you want to share the client with other teams or repositories, you can create a tarball and share it manually or via CDN, or preferably publish it to a NPM registry.

### Create a tarball

Inside `packages/client` run:

```bash
pnpm pack --pack-destination ./dir
```

### Publish to NPM

To publish the client to npmjs.com or a private NPM registry, you can run:

```bash
pnpm publish
```

Or for private packages:

```bash
pnpm publish --registry https://npm.my-registry.com --access restricted
```

## Learn More

- [Client reference](https://docs.wundergraph.com/docs/clients-reference/typescript-client)
- [TSUP](https://tsup.egoist.dev/)
- [Example repository](https://github.com/wundergraph/publish-client).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=simple)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
