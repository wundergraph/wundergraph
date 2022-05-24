#!/usr/bin/env sh

OUT_DIR="./go/wgpb"

mkdir -p ${OUT_DIR}

protoc  \
  --proto_path=./protos \
  --go_out=. \
  --experimental_allow_proto3_optional \
  wundernode_config.proto