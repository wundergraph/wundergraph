#!/bin/bash

set -e

docker exec minio -T mc alias set minio http://localhost:9000 minio minio123
docker exec minio -T mc admin user add minio test 12345678
docker exec minio -T mc admin policy set minio readwrite user=test
docker exec minio -T mc admin user info minio test
docker exec minio -T mc mb --ignore-existing minio/uploads
docker exec minio -T mc policy set public minio/uploads
