#!/bin/bash

set -e
set -x

if ! [[ -x scripts/mc ]]; then
	if [[ "$OSTYPE" == "linux-gnu"* ]]; then
		wget https://dl.min.io/client/mc/release/linux-amd64/mc -P scripts/
	elif [[ "$OSTYPE" == "darwin"* ]]; then
		if [[ $(uname -p) == "arm" ]]; then
			curl https://dl.min.io/client/mc/release/darwin-arm64/mc --output scripts/mc
		elif [[ $(uname -p) == "i386" ]]; then
			curl https://dl.min.io/client/mc/release/darwin-amd64/mc --output scripts/mc
		fi
	fi
fi

chmod +x ./scripts/mc
./scripts/mc alias set minio http://localhost:9000 minio minio123
./scripts/mc admin user add minio test 12345678
./scripts/mc admin policy attach minio readwrite -u test
./scripts/mc admin user info minio test
./scripts/mc mb --ignore-existing minio/uploads
./scripts/mc policy set public minio/uploads
