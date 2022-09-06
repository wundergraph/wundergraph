#!/bin/bash

set -e

# Bootstrap pnpm workspace

# Installwithout scripts because wunderctl has to be build first
pnpm install --ignore-scripts
# Build wunderctl
pnpm -r run --filter="./packages/wunderctl" build
# Build all libs + link all packages
pnpm build:libs && pnpm i
