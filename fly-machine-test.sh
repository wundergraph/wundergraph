#!/bin/sh

FLY_APP_NAME=$1
if [ -z "$FLY_APP_NAME" ]; then
		echo "Error: FLY_APP_NAME is not set"
		exit 1
fi

fly apps create --machines --name "$FLY_APP_NAME"
fly ips allocate-v4 -a "$FLY_APP_NAME"
fly m run --dockerfile Dockerfile-Cloud-Starter . -p 443:9991/tcp:tls:http --region fra -a "$FLY_APP_NAME"

# wait for user to press enter
read -p "Press enter to delete the app after testing"
fly apps destroy "$FLY_APP_NAME" --yes
