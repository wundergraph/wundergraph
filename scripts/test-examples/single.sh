#!/bin/sh

usage()
{
  echo "Usage: $0 [-u]" 1>&2
  echo "This script tests a single example, optionally updating dependencies to point to workspace" 1>&2
  echo "It must be run from the example directory e.g. ../../scripts/test-example.sh" 1>&2
  exit 2
}

update_package_json="no"

kill_with_children() {
    local pid=$1
    if children="`pgrep -P $pid`"; then
        for child in $children; do
            kill_with_children $child
        done
    fi
    kill $pid
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

set -x
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

if ! test -d node_modules; then
    npm install
fi

# Check for a script to bring up the required services
npm start
pid=$!

if grep -q '"wait-on:services"' package.json; then
    npm run wait-on:services
else
    sleep 1
fi

# Generate WunderGraph files
npm run generate

# Run test if available, otherwise just build or type-check
if grep -q '"test"' package.json; then
    NODE_URL=http://localhost:9991 npm test
elif grep -q '"check"' package.json; then
    npm run check
elif grep -q '"build"' package.json; then
    npm run build
fi

if grep -q '"playwright"' package.json; then
  npx -- playwright test
fi

# If we have something to cleanup e.g. a Docker cluster, do it
if grep -q '"cleanup"' package.json; then
		echo "Cleaning up"
    npm run cleanup
fi

# Kill all services we started in "start:services"
if test ! -z ${services_pid}; then
	if ps -p $services_pid > /dev/null; then
			echo "Killing services"
			kill_with_children ${services_pid}
	fi
fi


# If we have playwright based tests, run them
# Note that we always run these with npx
if test -f playwright.config.ts; then
    npx -- playwright test --headed

    # playwright might have restarted the container, stop it but ignore errors
    if test ! -z "${docker_compose_yml}" && test -f ${docker_compose_yml}; then
        cd `dirname ${docker_compose_yml}` && docker-compose down || true && cd -
    fi
fi

# Restore package.json
if test ${update_package_json} = "yes"; then
    git checkout -f package.json
fi
