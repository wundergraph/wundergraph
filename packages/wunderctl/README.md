# Wunderctl wrapper

![wunderctl](https://img.shields.io/npm/v/@wundergraph/wunderctl.svg)

This package is a wrapper for the wunderctl Go binary. It makes it super easy to run wundergraph commands from your terminal.
This package is not required if you have already installed [`@wundergraph/sdk`](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk). The SDK is shipped with the compatible wunderctl Go binary for development.

## Getting Started

```shell
# Create starter project
npx @wundergraph/wunderctl init
# Help
npx @wundergraph/wunderctl --help
```

> **Warning**: Please use the Go [release](https://github.com/wundergraph/wundergraph/releases) binary to start the wundergraph server in production.
