#!/usr/bin/env bash

set -e

for run in {1..100} ; do
  pnpm run --filter ./packages/testsuite test
done
