#!/bin/bash

set -e

# Bootstrap pnpm workspace

# Install wunderctl without scripts because wunderctl has to be build first
pnpm install --filter="./packages/wunderctl" --ignore-scripts
# Build wunderctl
pnpm -r run --filter="./packages/wunderctl" build
# Download wunderctl
pnpm -r run --filter="./packages/wunderctl" postinstall
# Install, link all packages + build all packages
pnpm install --ignore-scripts && pnpm build:libs
