#!/bin/sh

cd `dirname ${0}`/../../examples
find . -type d -maxdepth 1 |jq -Rn 'inputs|select(length>1)' | jq -cs . | jq 'map(.[2:])' | jq '_nwise(8)' | jq -n '[inputs]' | jq -c .
