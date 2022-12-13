#!/bin/sh

usage()
{
  echo "Usage: $0 [-u]" 1>&2
  echo "This script tests a single example, optionally updating dependencies to point to workspace" 1>&2
  echo "It must be run from the example directory e.g. ../../scripts/test-example.sh" 1>&2
  exit 2
}

update_package_json="no"

args=`getopt uh $*`
if test $? -ne 0; then
    usage
fi
set -- $args

while :; do
    case "$1" in
        -u)
            update_package_json="yes"
            shift
        ;;
        -h)
            usage
        ;;
        --)
            shift; break
            ;;
    esac
done

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

# Replace @wundergraph dependencies with workspace
if test ${update_package_json} = "yes"; then
    sed -i.bak -E 's/(@wundergraph\/.*": ")\^[0-9\.]+/\1workspace:*/g' package.json
    rm -fr package.json.bak

    pnpm install
fi

docker_compose_yml=`find . -name docker-compose.yml`

# If we have a Docker cluster, bring it up
if test ! -z "${docker_compose_yml}" && test -f ${docker_compose_yml}; then
    cd `dirname ${docker_compose_yml}` && docker-compose up -d && cd -
    # Wait for container services to start
    sleep 1
fi

# Check for a script to bring up the required services
services_pid=
if grep -q '"start:services"' package.json; then
    pnpm run start:services &
    services_pid=$!
    sleep 1
fi

if grep -q '"setup"' package.json; then
    pnpm run setup
fi

# Generate WunderGraph files
wunderctl generate

# Run test if available, otherwise just build or type-check
if grep -q '"test"' package.json; then
    pnpm test
elif grep -q '"check"' package.json; then
    pnpm check
elif grep -q '"build"' package.json; then
    pnpm build
fi

if test ! -z ${services_pid}; then
    kill_with_children ${services_pid}
fi

# If we have a Docker cluster, clean it up
if test ! -z "${docker_compose_yml}" && test -f ${docker_compose_yml}; then
    cd `dirname ${docker_compose_yml}` && docker-compose down && cd -
fi

# Restore package.json
if test ${update_package_json} = "yes"; then
    git checkout -f package.json
fi
