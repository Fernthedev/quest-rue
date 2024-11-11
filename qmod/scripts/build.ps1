Param(
    [Parameter(Mandatory=$false)]
    [Switch] $clean,

    [Parameter(Mandatory=$false)]
    [Switch] $gameAgnostic,

    [Parameter(Mandatory=$false)]
    [Switch] $help
)

if ($help -eq $true) {
    Write-Output "`"Build`" - Copiles your mod into a `".so`" or a `".a`" library"
    Write-Output "`n-- Arguments --`n"

    Write-Output "-Clean `t`t Deletes the `"build`" folder, so that the entire library is rebuilt"

    exit
}

# if user specified clean, remove all build files
if ($clean.IsPresent) {
    if (Test-Path -Path "build") {
        Remove-Item "build" -R
    }
}

if (($clean.IsPresent) -or (-not (Test-Path -Path "build"))) {
    New-Item -Path "build" -ItemType Directory
}

$def = "ON"
if ($gameAgnostic.IsPresent) {
    $def = "OFF"
}

& cmake -G "Ninja" -DCMAKE_BUILD_TYPE="RelWithDebInfo" -DBEAT_SABER="$def" -B build -Wno-dev
& cmake --build ./build
