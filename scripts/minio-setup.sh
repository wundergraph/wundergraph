#!/bin/bash

set -e

if ! [[ -x scripts/mc ]]; then
	if [[ "$OSTYPE" == "linux-gnu"* ]]; then
		wget https://dl.min.io/client/mc/release/linux-amd64/mc -P scripts/
	elif [[ "$OSTYPE" == "darwin"* ]]; then
		if [[ $(uname -p) == "arm" ]]; then
			wget https://dl.min.io/client/mc/release/darwin-arm64/mc -P scripts/
		elif [[ $(uname -p) == "i386" ]]; then
			wget https://dl.min.io/client/mc/release/darwin-amd64/mc -P scripts/
		fi
	fi
fi

chmod +x ./scripts/mc
./scripts/mc alias set minio http://localhost:9000 minio minio123
./scripts/mc admin user add minio test 12345678
./scripts/mc admin policy set minio readwrite user=test
./scripts/mc admin user info minio test
./scripts/mc mb --ignore-existing minio/uploads
./scripts/mc policy set public minio/uploads
