#!/usr/bin/env sh

set -x
set -e

protoc  \
  --proto_path=./protos \
  --go_out=.. \
  --go_opt=module=github.com/wundergraph/wundergraph \
  --go_opt=paths=import \
  --experimental_allow_proto3_optional \
  wundernode_config.proto

outfile="../pkg/wgpb/wundernode_config.pb.go"
tmp="${outfile}.tmp"

# Remove comments with version numbers
grep -v "^//.*protoc.*v" ${outfile} > ${tmp} && mv -f ${tmp} ${outfile} && rm -f ${tmp}
