#!/bin/sh

# This script bumps the wunderctl version in the SDK package,
# optionally creating a branch and a PR (see -h for help)
#
# It must ran from the root of the monorepo

WUNDERCTL_PACKAGE_JSON=packages/wunderctl/package.json 
SDK_PACKAGE_JSON=packages/sdk/package.json
TMP_PACKAGE_JSON=package.json.tmp

function usage() {
    echo $0 [-b] [-p]
    echo "-b:\tCreate a new branch before committing"
    echo "-p:\tCreate PR after comitting the result"
    exit 1
}

create_branch=no
create_pr=no

while getopts "hpb" arg; do
  case $arg in
    h)
      usage
      ;;
    b)
      create_branch=yes
      ;;
    p)
      create_pr=yes
      ;;
  esac
done

set -e
set -x

wunderctl_version=$(cat ${WUNDERCTL_PACKAGE_JSON} | jq -r '.version')
echo wunderctl version is ${wunderctl_version}

if [ ${create_branch} = "yes" ]; then
    git checkout -b chore/bump-wunderctl-dependency-in-sdk-to-${wunderctl_version}
fi


jq ".dependencies += {\"@wundergraph/wunderctl\": \"workspace:^${wunderctl_version}\"}" ${SDK_PACKAGE_JSON} > ${TMP_PACKAGE_JSON}
mv -f ${TMP_PACKAGE_JSON} ${SDK_PACKAGE_JSON}
pnpm i
git add pnpm-lock.yaml ${SDK_PACKAGE_JSON}
git commit -v -m "chore: bump wunderctl dependency in SDK to ${wunderctl_version}"

if [ ${create_pr} = "yes" ]; then
    gh pr create -f
fi
