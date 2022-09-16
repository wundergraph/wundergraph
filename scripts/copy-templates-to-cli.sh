#!/bin/bash

set -e

# Copy templates to the CLI
# It removes the destination directory first and then all .gitignored files

e1="pkg/templates/assets/templates/application"
rm -rf $e1 && cp -r examples/simple/. $e1 && git clean -X -f $e1

e2="pkg/templates/assets/templates/nextjs-starter"
rm -rf $e2 && cp -r examples/nextjs/. $e2 && git clean -X -f $e2

e4="pkg/templates/assets/templates/publish-api"
rm -rf $e4 && cp -r examples/publish-install-api/. $e4 && git clean -X -f $e4

e5="pkg/templates/assets/templates/nextjs-postgres-starter"
rm -rf $e5 && cp -r examples/nextjs-postgres-prisma/. $e5 && git clean -X -f $e5
