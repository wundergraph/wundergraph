#!/bin/sh

kill_with_children() {
    local pid=$1
    if children="`pgrep -P $pid`"; then
        for child in $children; do
            kill_with_children $child
        done
    fi
    kill $pid
}

if ! test -f package.json || ! test -d ../../examples; then
    echo "Run this from the example directory" 1>&2
    exit 1
fi

set -x
set -e

# Wipe cache and generated files. This should have no impact in
# CI, but helps when testing locally
rm -fr .wundergraph/generated .wundergraph/cache

# Replace @wundergraph with workspace versions
grep '@wundergraph' package.json | awk '{gsub(/"|:/, "", $1); print $1"@workspace"}'| xargs pnpm install
pnpm install --no-frozen-lockfile

docker_compose_yml=`find . -name docker-compose.yml`

# If we have a Docker cluster, bring it up
if test ! -z "${docker_compose_yml}" && test -f ${docker_compose_yml}; then
    cd `dirname ${docker_compose_yml}` && docker-compose up -d && cd -
    # Wait for container services to start
    sleep 5
fi

# Check for a script to bring up the required services
services_pid=
if grep -q '"services"' package.json; then
    npm run services &
    services_pid=$!
    sleep 5
fi

# Generate WunderGraph files
wunderctl generate

# Run test if available, otherwise just type-check
if grep -q '"test"' package.json; then
    pnpm test
else
    pnpm check
fi

if test ! -z ${services_pid}; then
    kill_with_children ${services_pid}
fi

# If we have a Docker cluster, clean it up
if test ! -z "${docker_compose_yml}" && test -f ${docker_compose_yml}; then
    cd `dirname ${docker_compose_yml}` && docker-compose down && cd -
fi

# Restore package.json
git checkout -f package.json
