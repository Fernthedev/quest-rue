cpmaddpackage(
    NAME
    Boost
    VERSION
    1.86.0 # Versions less than 1.85.0 may need patches for installation targets.
    URL
    https://github.com/boostorg/boost/releases/download/boost-1.86.0/boost-1.86.0-cmake.tar.xz
    URL_HASH
    SHA256=2c5ec5edcdff47ff55e27ed9560b0a0b94b07bd07ed9928b476150e16b0efc57
    OPTIONS
    "BOOST_ENABLE_CMAKE ON"
    "BOOST_SKIP_INSTALL_RULES ON"
    "BOOST_INCLUDE_LIBRARIES asio"
)
