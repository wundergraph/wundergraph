#!/usr/bin/env sh

protoc  \
  --proto_path=./protos \
  --go_out=.. \
  --go_opt=module=github.com/wundergraph/wundergraph \
  --go_opt=paths=import \
  --experimental_allow_proto3_optional \
  wundernode_config.proto
