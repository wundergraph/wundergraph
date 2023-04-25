#!/bin/bash
set -euo pipefail

docker-compose up -d

sleep 3

function setupMinio () {
    docker-compose exec -T minio mc alias set minio http://localhost:9000 minio minio123
    docker-compose exec -T minio mc admin user add minio test 12345678
    docker-compose exec -T minio mc admin policy attach minio readwrite -u test
    docker-compose exec -T minio mc admin user info minio test
    docker-compose exec -T minio mc mb --ignore-existing minio/uploads
    docker-compose exec -T minio mc policy set public minio/uploads
    return $?
}

retry=0
maxRetries=3
retryInterval=3
until [ ${retry} -ge ${maxRetries} ]
do
    setupMinio && break
    retry=$[${retry}+1]
    echo "Retrying [${retry}/${maxRetries}] in ${retryInterval}(s) "
    sleep ${retryInterval}
done

if [ ${retry} -ge ${maxRetries} ]; then
    echo "Failed after ${maxRetries} attempts!"
    exit 1
fi
