#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

fn get_str(ios: Vec<u8>) -> String {
    String::from_utf8(ios).expect("Failed to parse output as string")
}

fn get_device_name(id: String) -> Result<String, ()> {
    match Command::new("adb")
        .arg("-s")
        .arg(id)
        .arg("shell")
        .arg("getprop ro.product.model")
        .output()
    {
        Err(e) => {
            println!("Error finding device name: {}", e);
            Err(())
        }
        Ok(cmd) => Ok(get_str(cmd.stdout).trim().to_string()),
    }
}

fn parse_devices(stdout: String) -> Vec<(String, String)> {
    // first line is "List of devices attached"
    let list = stdout.lines().skip(1);
    let mut vec = Vec::new();
    for device in list {
        let mut split = device.split_whitespace();
        let id = match split.next() {
            None => break,
            Some("") => break,
            Some(s) => s.to_string(),
        };
        if split.next() != Some("device") {
            continue;
        }
        let name = get_device_name(id.clone()).unwrap_or_else(|_| id.clone());
        vec.push((id, name));
    }
    vec
}

#[tauri::command]
fn check_adb() -> Result<String, ()> {
    println!("Checking for adb!");
    match Command::new("adb").arg("--version").output() {
        Err(e) => {
            println!("Error checking for adb: {}", e);
            Err(())
        }
        Ok(cmd) => Ok(get_str(cmd.stdout)),
    }
}

#[tauri::command]
fn list_devices() -> Vec<(String, String)> {
    println!("Get adb devices");
    match Command::new("adb").arg("devices").arg("-l").output() {
        Err(e) => {
            println!("Error listing devices: {}", e);
            Vec::new()
        }
        Ok(cmd) => parse_devices(get_str(cmd.stdout)),
    }
}

#[tauri::command]
fn adb_forward(device: String, port: String) -> Result<(), String> {
    println!("Forwarding port {} on device {}", port, device);
    let tcp = format!("tcp:{}", port);
    match Command::new("adb")
        .arg("-s")
        .arg(device)
        .arg("forward")
        .arg(tcp.clone())
        .arg(tcp)
        .output()
    {
        Err(e) => Err(e.to_string()),
        Ok(_) => Ok(()),
    }
}

#[tauri::command]
fn adb_unforward(device: String, port: String) -> Result<(), String> {
    println!("Removing forwarded port {} on device {}", port, device);
    let tcp = format!("tcp:{}", port);
    match Command::new("adb")
        .arg("-s")
        .arg(device)
        .arg("forward")
        .arg("--remove")
        .arg(tcp)
        .output()
    {
        Err(e) => Err(e.to_string()),
        Ok(_) => Ok(()),
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            check_adb,
            list_devices,
            adb_forward,
            adb_unforward
        ])
        .plugin(tauri_plugin_websocket::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
