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

# To avoid requiring contributors to use the same exact protoc version, allowing
# slightly different but compatible versions, remove the version numbers that the
# Go generator drops into the file.
#
# To make supported both Linux and macOS easier, use grep with a regular expression
# instead of sed commands (grep is not that different between BSD and Linux, while
# sed has more significant incompatibilities between both OSes).
grep -v "^//.*protoc.*v" ${outfile} > ${tmp} && mv -f ${tmp} ${outfile} && rm -f ${tmp}
