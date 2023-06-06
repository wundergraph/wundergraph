#!/bin/sh

target=workspace
single_args=

case "$1" in
    release)
        target=release
        single_args="-p"
    ;;
    *)
        break
    ;;
esac


set -e

# These require 3rd party accounts
SKIP="faunadb-nextjs graphql-hasura-subscriptions inject-bearer"

# These are broken
SKIP="${SKIP} nextjs-todos remix nuxt"

## Doesn't support monorepo
SKIP="${SKIP} expo-swr"

# XXX: This breaks only in CI (fastify issue?)
SKIP="${SKIP} graphql-ws-subscriptions"

# Move to repo root
cd `dirname ${0}`/../..

if test ${target} = "workspace"; then
    # Add examples to workspace
		echo "  - 'examples/*'" >> pnpm-workspace.yaml
		# nuxt + pnpm is broken Refer: https://github.com/nuxt/nuxt/issues/14146
		echo "  - '!examples/nuxt'" >> pnpm-workspace.yaml

    # Replace dependencies with workspace
    find examples -name package.json -exec sed -i.bak -E 's/(@wundergraph\/.*": ")\^[0-9\.]+/\1workspace:*/g' {} \;
    find examples -name package.json.bak -exec rm {} \;
    pnpm install --no-frozen-lockfile
fi

# Move to repo root
cd `dirname ${0}`/../..

cd examples
for example in `ls -d */`; do
    if test ! -z "${TEST_FILTER}" && ! echo "${TEST_FILTER}" | grep -q -E "(^| )`basename ${example}`($| )"; then
    echo "filter ${example}"
        continue
    fi

    if echo ${SKIP} | grep -q -E "(^| )`basename ${example}`($| )"; then
        echo Skipping ${example}...
        continue
    fi
    echo Testing ${example}...
    cd ${example}
    ../../scripts/test-examples/single.sh ${single_args}
    cd ..
done
cd ..

if test ${target} = "workspace"; then
    # Restore package.json files in examples
    find examples -maxdepth 2  -name package.json | xargs git checkout

    # Restore workspace and lockfile
    git checkout pnpm-workspace.yaml pnpm-lock.yaml
fi
