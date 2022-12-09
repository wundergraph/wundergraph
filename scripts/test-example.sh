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

# Generate WunderGraph files
wunderctl generate



if grep '"test"' package.json > /dev/null; then
    pnpm test
else
    pnpm check
fi

# Restore package.json
git checkout -f package.json
