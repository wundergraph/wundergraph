#!/bin/sh

if ! test -f package.json || ! test -d ../../examples; then
    echo "Run this from the example directory" 1>&2
    exit 1
fi

set -x
set -e

# Replace @wundergraph with workspace versions
grep '@wundergraph' package.json | awk '{gsub(/"|:/, "", $1); print $1"@workspace"}'| xargs pnpm install
pnpm install --no-frozen-lockfile


# If we have a Docker cluster, bring it up
if test -f docker-compose.yml; then
    docker-compose up -d
    # Wait for container services to start
    sleep 5
fi

# Generate WunderGraph files
wunderctl generate

# Run test if available, otherwise just type-check
if grep '"test"' package.json > /dev/null; then
    pnpm test
else
    pnpm check
fi

# If we have a Docker cluster, clean it up
if test -f docker-compose.yml; then
    docker-compose down
fi

# Restore package.json
git checkout -f package.json
