#!/usr/bin/env sh

PROTOC_GEN_TS_PROTO_PATH="./node_modules/.bin/protoc-gen-ts_proto"
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"

OUT_DIR="./wgpb"

mkdir -p ${OUT_DIR}

protoc  \
  --plugin="${PROTOC_GEN_TS_PROTO_PATH}" \
  --proto_path=../../types/protos \
  --experimental_allow_proto3_optional \
  --ts_proto_opt=unrecognizedEnum=false \
  --ts_proto_opt=esModuleInterop=true \
  --ts_proto_opt=env=node \
  --ts_proto_opt=outputEncodeMethods=true \
  --ts_proto_opt=outputJsonMethods=true \
  --ts_proto_opt=outputClientImpl=false \
  --ts_proto_out="${OUT_DIR}" \
  ../../types/protos/*.proto
