#!/bin/sh

set -e

default_node_url=http://localhost:9991

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

cd ..
wunderctl start &
pid=$!

trap "kill_with_children ${pid}" EXIT

# Wait for server health check
while true; do
    if ! curl -f -s ${default_node_url}/health; then
        sleep 1
        continue
    fi
    health=$(curl -f -s ${default_node_url}/health)
    node_status=$(echo ${health} | jq .nodeStatus)
    server_status=$(echo ${health} | jq .serverStatus)
    if [ x${node_status} = 'x"READY"' ] && ([ x${server_status} = 'x"READY"' ] || [ x${server_status} = 'x"SKIP"' ]); then
        break
    fi
    sleep 1
    # Make sure npm start is still running
    kill -0 ${pid}
done

# Run rust tests
cd rust && cargo test
