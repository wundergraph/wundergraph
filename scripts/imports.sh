#!/bin/bash

set -e

go install github.com/incu6us/goimports-reviser/v3@master

cd pkg && goimports-reviser -company-prefixes github.com/wundergraph -project-name github.com/wundergraph/wundergraph -set-exit-status -format ./...

