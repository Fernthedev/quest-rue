if (Test-Path ".\protobuf\") {
    del ./protobuf -Confirm -Recurse
}
mkdir ./protobuf
# & protoc -I="..\protos" --cpp_out="protobuf" ..\protos\qrue.proto
# Use VCPKG protobuf for consistency
& "$ENV:VCPKG_ROOT\installed\arm64-android\tools\protobuf\protoc.exe" --proto_path=../protos --cpp_out=./protobuf ../protos/unity.proto ../protos/il2cpp.proto ../protos/qrue.proto