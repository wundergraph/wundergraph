#!/bin/sh

usage()
{
  echo "Usage: $0 [-u] [-p]" 1>&2
  echo "This script tests a single example, optionally updating dependencies to point to workspace" 1>&2
  echo "It must be run from the example directory e.g. ../../scripts/test-example.sh" 1>&2
  exit 2
}

update_package_json="no"
npm=pnpm

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
        -p)
            npm=npm
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

    ${npm} install
fi

if ! test -d node_modules; then
    ${npm} install
fi

# Check for a script to bring up the required services
if grep -q '"start:services"' package.json; then
    ${npm} run start:services &
    if grep -q '"wait-on:services"' package.json; then
        ${npm} run wait-on:services
    else
        sleep 1
    fi
fi

if grep -q '"setup"' package.json; then
    ${npm} run setup
fi

# Generate WunderGraph files
npm run generate

# Run test if available, otherwise just build or type-check
if grep -q '"test"' package.json; then
    ${npm} test
elif grep -q '"check"' package.json; then
    ${npm} run check
elif grep -q '"build"' package.json; then
    ${npm} run build
fi

# If we have something to cleanup e.g. a Docker cluster, do it
if grep -q '"cleanup"' package.json; then
    ${npm} run cleanup
fi

# Restore package.json
if test ${update_package_json} = "yes"; then
    git checkout -f package.json
fi
