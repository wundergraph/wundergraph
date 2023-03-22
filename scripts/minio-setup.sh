#!/bin/bash

set -e

docker exec -T minio mc alias set minio http://localhost:9000 minio minio123
docker exec -T minio mc admin user add minio test 12345678
docker exec -T minio mc admin policy set minio readwrite user=test
docker exec -T minio mc admin user info minio test
docker exec -T minio mc mb --ignore-existing minio/uploads
docker exec -T minio mc policy set public minio/uploads
