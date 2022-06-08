# Use VCPKG protobuf for consistency
& "$ENV:VCPKG_ROOT\installed\x64-windows\tools\protobuf\protoc.exe" --proto_path=../protos --ts_out=./src/misc/proto ../protos/qrue.proto