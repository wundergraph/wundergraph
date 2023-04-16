# Testsuite

This directory contains the testsuite for the WunderGraph SDK.

## Getting started

```shell
pnpm test
```

## Guide

Tests are written using the [Vitest](https://vitest.dev/) framework. This package is managed as a [Vite workspace](https://vitest.dev/guide/workspace.html).
This means you can manage all tests from a single package. You can run the tests in watch mode using `pnpm test:watch`. As part of the global setup, every app is built with `wunderctl` and the output is validated with `tsc`. A test runs in a separate process. This means that the tests are isolated from each other.

### Writing tests

Tests are written in the `*.test.ts` files. Every app has its own WunderGraph configuration files and an entry in `vitest.workspace.ts`.
