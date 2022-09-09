#!/bin/bash

set -e

printf "{\"name\": \"examples\"}" > examples/package.json
printf "packages:\n  - '*'" > examples/pnpm-workspace.yaml
cd examples && pnpm up -r "@wundergraph/sdk@latest" "@wundergraph/nextjs@latest"
rm -rf node_modules package.json pnpm-workspace.yaml pnpm-lock.yaml
