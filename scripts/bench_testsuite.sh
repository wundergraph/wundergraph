#!/usr/bin/env bash

set -e

COUNTER=1

for run in {1..30} ; do
	echo "!-----------------------!"
	echo "Round $COUNTER of 30"
	echo "!-----------------------!"
  pnpm run --filter ./packages/testsuite test
  COUNTER=$[$COUNTER +1]
done
