#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    net::{IpAddr, Ipv4Addr, SocketAddr},
    str::FromStr,
    sync::Mutex,
};

use tokio::net::TcpStream;

mod protos;

#[derive(Default)]
struct AppState {
    tcp_stream: Mutex<Option<TcpStream>>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![connect, disconnect])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

// ugh, Tauri doesn't like Future<std::result::Result<(), anyhow::Error>> because anyhow::Error doesn't implement Serialize/Deserialize
fn map_result<R, E: std::error::Error>(res: Result<R, E>) -> anyhow::Result<R, String> {
  match res {
    Ok(e) => Ok(e),
    Err(e) => Err(e.to_string())
  }
}

// ugh, Tauri doesn't like Future<std::result::Result<(), anyhow::Error>> because anyhow::Error doesn't implement Serialize/Deserialize
// this is so stupid
fn map_error<E: std::error::Error>(e: E) -> String {
  e.to_string()
}

#[tauri::command]
async fn connect(ip: String, port: u16, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let socket_address = SocketAddr::new(IpAddr::V4(Ipv4Addr::from_str(&ip).map_err(map_error)?), port);

    *state
        .tcp_stream
        .lock()
        .expect("Unable to unlock tcp stream") = Some(TcpStream::connect(socket_address).await.map_err(map_error)?);
    Ok(())
}

#[tauri::command]
async fn disconnect(state: tauri::State<'_, AppState>) -> Result<(), String> {

    // if let Some(stream) = &mut *state.tcp_stream.lock().expect("Unable to get lock tcp stream") {
    //     stream.shutdown().await.map_err(map_error)?;
    // }

    *state.tcp_stream.lock().expect("Unable to get lock tcp stream") = None;

    Ok(())
}
