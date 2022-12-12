#!/bin/sh


# These require 3rd party accounts
SKIP="faunadb-nextjs graphql-hasura-subscriptions"

# These are broken
SKIP="${SKIP} nextjs-todos publish-install-api vite-swr"

set -e

# Move to repo root
cd `dirname ${0}`/../

# Add examples to workspace
echo "  - 'examples/*'" >> pnpm-workspace.yaml

# Replace dependencies with workspace
find examples -name package.json -exec sed -i.bak -E 's/(@wundergraph\/.*": ")\^[0-9\.]+/\1workspace:*/g' {} \;
find examples -name package.json.bak -exec rm {} \;
pnpm install --no-frozen-lockfile

cd examples
for example in `ls -d */`; do
    if echo ${SKIP} | grep -q -w `basename ${example}`; then
        echo Skipping ${example}...
        continue
    fi
    echo Testing ${example}...
    cd ${example}
    ../../scripts/test-example.sh
    cd ..
done


cd ..
find examples -name package.json | grep -v '\.next' | xargs git checkout
git checkout pnpm-workspace.yaml pnpm-lock.yaml
