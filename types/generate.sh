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

outfile='../pkg/wgpb/wundernode_config.pb.go'

# Remove version numbers. Generating the backup is required
# for compatibility with both GNU and BSD sed variants.
sed -i.bak '2,4d' ${outfile}
rm -f ${outfile}.bak
