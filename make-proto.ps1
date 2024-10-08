Param(
    [Parameter(Mandatory=$false)]
    [Switch] $y
)
# Use VCPKG protobuf for consistency
if (Test-Path ./qmod/protobuf/) {
    if ($y) {
        Remove-Item ./qmod/protobuf -Recurse -Force
    }
    else {
        Remove-Item ./qmod/protobuf -Recurse -Confirm -Force
    }
}
mkdir ./qmod/protobuf
# & protoc -I="..\protos" --cpp_out="protobuf" ..\protos\qrue.proto
# Use VCPKG protobuf for consistency

& vcpkg_installed/arm64-android/tools/protobuf/protoc --proto_path=./protos `
    --cpp_out=./qmod/protobuf `
    ./protos/qrue.proto ./protos/il2cpp.proto ./protos/unity.proto ./protos/paper.proto
