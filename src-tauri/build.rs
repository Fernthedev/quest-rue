use std::{path::Path, option};

use protoc_rust::Customize;

fn main() {
    let protoc = Path::new(option_env!("VCPKG_ROOT").unwrap_or(""))
        .join("installed")
        .join("arm64-android")
        .join("tools")
        .join("protobuf")
        .join("protoc");

    let mut proto_invoke = protoc_rust::Codegen::new();

    // USE VCPKG PROTOBUF BY DEFAULT
    if protoc.exists() {
        println!("Using \"{:?}\" for protoc", &protoc);
        proto_invoke.protoc_path(protoc);
    } else {
        eprintln!("Using system's protoc instead of VCPKG! This may cause packet consistency issues!");
    }

    proto_invoke
        .customize(Customize {
            gen_mod_rs: Some(true),
            ..Default::default()
        })
        .out_dir("src/protos")
        .inputs(&["../protos/qrue.proto"])
        .include("../protos")
        .run()
        .expect("Running protoc failed.");

    tauri_build::build()
}
