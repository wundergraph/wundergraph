#!/bin/bash

set -e

# Bootstrap pnpm workspace

# install workspace without scripts
pnpm install --filter="./packages/wunderctl" --ignore-scripts
# Build wunderctl before run postinstall
pnpm -r run --filter="./packages/wunderctl" build
# Build all libs, run scripts and link all packages
pnpm install && pnpm build
