#!/bin/sh


# These require 3rd party accounts
SKIP="graphql-hasura-subscriptions"

# These are broken
SKIP="${SKIP} nextjs-todos schema-extension vite-swr"

set -e

cd `dirname ${0}`/../examples
for example in `ls -d */`; do
    if echo ${SKIP} | grep -q -w `basename ${example}`; then
        echo Skipping ${example}...
        continue
    fi
    pushd ${example}
    ../../scripts/test-example.sh
    popd
done
