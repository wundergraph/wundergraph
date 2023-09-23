#!/bin/bash

set -e
set -x

function usage() {
    echo $0 [-b] [-p]
    echo "-c:\tCreate a commit with the result"
    echo "-b:\tCreate a new branch before committing"
    echo "-p:\tCreate PR after comitting the result"
    exit 1
}

create_branch=no
create_pr=no
commit=no

while getopts "hpcb" arg; do
  case $arg in
    h)
      usage
      ;;
    c)
      commit=yes
      ;;
    b)
      create_branch=yes
      ;;
    p)
      create_pr=yes
      ;;
  esac
done

sdk_version=$(cat packages/sdk/package.json | jq -r '.version')
printf "{\"name\": \"examples\"}" > examples/package.json
printf "packages:\n  - '*'" > examples/pnpm-workspace.yaml
cd examples && pnpm up -r "@wundergraph/*@latest" && cd -
git checkout -f pnpm-workspace.yaml pnpm-lock.yaml

if [ ${create_branch} = "yes" ]; then
    git checkout -b chore/bump-sdk-dependency-in-examples-${sdk_version}
fi


if [ ${commit} = "yes" ]; then
    git add -u examples
    git commit -v -m "chore: bump SDK dependency in examples to ${sdk_version}"
fi

if [ ${create_pr} = "yes" ]; then
    gh pr create -f
fi
