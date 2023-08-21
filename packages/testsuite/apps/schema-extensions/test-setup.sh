#!/bin/bash

set -e

docker compose -f apps/schema-extensions/docker-compose.yml up -d
pnpm exec wait-on -d 10000 tcp:54322
pnpm exec prisma migrate dev --name init-db --schema ./apps/schema-extensions/schema.prisma
