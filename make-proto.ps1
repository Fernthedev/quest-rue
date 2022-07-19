# Use VCPKG protobuf for consistency 
if (Test-Path ".\qmod\protobuf\") {
    del ./qmod/protobuf -Recurse -Confirm -Force
}
mkdir ./qmod/protobuf
# & protoc -I="..\protos" --cpp_out="protobuf" ..\protos\qrue.proto
# Use VCPKG protobuf for consistency
& "$ENV:VCPKG_ROOT\installed\arm64-android\tools\protobuf\protoc.exe" --proto_path=./protos --ts_out=./src/misc/proto --cpp_out=./qmod/protobuf ./protos/qrue.proto ./protos/il2cpp.proto ./protos/unity.proto  