# Use VCPKG protobuf for consistency 
& "$ENV:VCPKG_ROOT\installed\x64-windows\tools\protobuf\protoc.exe" --proto_path=./protos --ts_out=./src/misc/proto ./protos/qrue.proto
if (Test-Path ".\qmod\protobuf\") {
    del ./qmod/protobuf -Confirm -Recurse
}
mkdir ./qmod/protobuf
# & protoc -I="..\protos" --cpp_out="protobuf" ..\protos\qrue.proto
# Use VCPKG protobuf for consistency
& "$ENV:VCPKG_ROOT\installed\arm64-android\tools\protobuf\protoc.exe" --proto_path=./protos --cpp_out=./qmod/protobuf ./protos/qrue.proto