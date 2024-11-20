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

# Use VCPKG protobuf for consistency
& vcpkg_installed/arm64-android/tools/protobuf/protoc -Iprotos --cpp_out=./qmod/protobuf ./protos/*
