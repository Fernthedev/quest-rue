#!/bin/sh

./vcpkg_installed/arm64-android/tools/protobuf/protoc --proto_path=./protos \
    --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
    --ts_proto_opt=forceLong=bigint --ts_proto_opt=oneof=unions --ts_proto_opt=esModuleInterop=true \
    --ts_proto_out=./src/misc/proto \
    --cpp_out=./qmod/protobuf \
    ./protos/qrue.proto ./protos/il2cpp.proto ./protos/unity.proto ./protos/paper.proto