#!/bin/sh

usage()
{
  echo "Usage: $0 [-u]" 1>&2
  echo "This script tests a single example, optionally updating dependencies to point to workspace" 1>&2
  echo "It must be run from the example directory e.g. ../../scripts/test-example.sh" 1>&2
  exit 2
}

default_node_url=http://localhost:9991
update_package_json="no"

kill_with_children() {
    local pid=$1
    if children="`pgrep -P ${pid}`"; then
        for child in $children; do
            kill_with_children ${child}
        done
    fi
    # Ignore errors here
    kill ${pid} > /dev/null 2> /dev/null || true
}

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

if ! test -f package.json || ! test -d ../../examples; then
    echo "Run this from the example directory" 1>&2
    exit 1
fi

set -e

# Wipe cache and generated files. This should have no impact in
# CI, but helps when testing locally
rm -fr .wundergraph/generated .wundergraph/cache

# Replace @wundergraph dependencies with workspace
if test ${update_package_json} = "yes"; then
    sed -i.bak -E 's/(@wundergraph\/.*": ")\^[0-9\.]+/\1workspace:*/g' package.json
    rm -fr package.json.bak

    # We're replacing modules with workspace copies, need to use
    # pnpm to install since npm doesn't understand workspaces
    pnpm install
fi

# If we have an example .env.example file
# copy it to .env to use default values in the CI
if test -f .env.example && ! test -f .env; then
	cp -n .env.example .env
fi

if ! test -d node_modules; then
    npm install
fi

# Check for a script to bring up the required services
npm start &
pid=$!

trap "kill_with_children ${pid}" EXIT

# Wait for code generation to complete
while ! test -f .wundergraph/generated/wundergraph.schema.graphql; do
    sleep 0.1
    # Make sure npm start is still running
    kill -0 ${pid}
done


# Run test if available, otherwise just build or type-check
if grep -q '"test"' package.json; then
    WG_NODE_URL=${default_node_url} npm test
elif grep -q '"check"' package.json; then
    npm run check
elif grep -q '"build"' package.json; then
    npm run build
fi

if grep -q '"test:playwright"' package.json; then
    # This is a no-op if playwright is already installed
    npx -- playwright install --with-deps chromium
    WG_NODE_URL=${default_node_url} npm run test:playwright
fi

# If we have something to cleanup e.g. a Docker cluster, do it
if grep -q '"cleanup"' package.json; then
    echo "Cleaning up"
    npm run cleanup
fi

# Restore package.json
if test ${update_package_json} = "yes"; then
    git checkout -f package.json
fi
