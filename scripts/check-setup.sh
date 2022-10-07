#!/bin/bash

set -e

# Check if protoc is installed
if ! [ -x "$(command -v protoc)" ]; then
	echo 'Error: protoc is not installed. Please install exact 3.21.5 https://grpc.io/docs/protoc-installation'
	echo 'curl -LO "https://github.com/protocolbuffers/protobuf/releases/download/v21.5/protoc-21.5-linux-x86_64.zip"'
	exit 1
fi

if ! [ -x "$(command -v golangci-lint)" ]; then
	echo "Installing golangci-lint"
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
fi
