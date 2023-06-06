#!/bin/bash
set -euo pipefail

docker-compose up -d

sleep 3

function setupMinio () {
  docker-compose exec minio1 mc alias set myminio/ http://localhost:9000 minio minio123
  docker-compose exec minio1 mc admin user add myminio test 12345678
  docker-compose exec minio1 mc admin policy set myminio readwrite user=test
  docker-compose exec minio1 mc admin user info myminio test
  docker-compose exec minio1 mc mb myminio/uploads
  docker-compose exec minio1 mc policy set public myminio/uploads
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
