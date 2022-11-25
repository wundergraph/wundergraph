#!/bin/bash

HASURA_FOLDER=/usr/src/hasura/app
cd $HASURA_FOLDER || {
    echo "Hasura folder '$HASURA_FOLDER' not found"
    exit 1
}

# Workaround for https://github.com/hasura/graphql-engine/issues/2824#issuecomment-801293056
socat TCP-LISTEN:8080,fork TCP:hasura-engine:8080 &
socat TCP-LISTEN:9695,fork,reuseaddr,bind=hasura-console TCP:127.0.0.1:9695 &
socat TCP-LISTEN:9693,fork,reuseaddr,bind=hasura-console TCP:127.0.0.1:9693 &
{
    echo "Applying migrations..."
    hasura migrate apply --database-name=default || exit 1

    echo "Applying metadata changes..."
    hasura metadata apply || exit 1

    # Run console if specified
    echo "Starting console..."
    cd $HASURA_FOLDER
    hasura console --log-level DEBUG --address "127.0.0.1" --no-browser || exit 1
}
