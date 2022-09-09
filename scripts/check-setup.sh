#!/bin/bash

set -e

# Check if protoc is installed
if ! [ -x "$(command -v protoc)" ]; then
	echo 'Error: protoc is not installed. Please install exact (3.12.4) https://grpc.io/docs/protoc-installation'
	exit 1
fi
