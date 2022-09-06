#!/bin/bash

set -e

# Bootstrap pnpm workspace

# install workspace without scripts
pnpm install --ignore-scripts
# Build wunderctl before run postinstall
pnpm -r run --filter="./packages/wunderctl" build
# Build everything, run scripts and link all packages
pnpm build && pnpm install
