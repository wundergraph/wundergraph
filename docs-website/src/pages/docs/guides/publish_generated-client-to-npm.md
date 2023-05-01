---
title: Publish the generated client to NPM
pageTitle: WunderGraph - Publish the generated client to NPM
description: This guide shows how to publish the generated client to NPM
---

This guide shows you how to bundle the generated client code for distribution to NPM.

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
    "zod": "^3.21.4"
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

After building the client, it's ready to be published to NPM, Google Packages or a private package registry.

## Learn More

- [Client reference](https://docs.wundergraph.com/docs/clients-reference/typescript-client)
- [TSUP](https://tsup.egoist.dev/)

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=simple)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
