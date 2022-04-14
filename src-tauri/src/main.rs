#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
#![feature(mutex_unlock)]
use appstate::AppState;
use protos::qrue::{PacketWrapper, SearchObjects};

mod appstate;
mod protos;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            read_thread_loop,
            request_game_objects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

// ugh, Tauri doesn't like Future<std::result::Result<(), anyhow::Error>> because anyhow::Error doesn't implement Serialize/Deserialize
fn map_result<R, E: std::error::Error>(res: Result<R, E>) -> anyhow::Result<R, String> {
    match res {
        Ok(e) => Ok(e),
        Err(e) => Err(e.to_string()),
    }
}

// ugh, Tauri doesn't like Future<std::result::Result<(), anyhow::Error>> because anyhow::Error doesn't implement Serialize/Deserialize
// this is so stupid
fn map_error<E: std::error::Error>(e: E) -> String {
    e.to_string()
}

fn map_err<T, E, F, O: FnOnce(E) -> F>(r: Result<T, E>, op: O) -> Result<T, F> {
    match r {
        Ok(o) => Ok(o),
        Err(e) => Err(op(e)),
    }
}

#[inline]
// I hate this I hate this I hate this
fn map_anyhow_str<T>(r: Result<T, anyhow::Error>) -> Result<T, String> {
    match r {
        Ok(o) => Ok(o),
        Err(e) => Err(e.to_string()),
    }
}

// Must be called after connect()
// Dies when close() is called
//
// Runs on a new thread, as stated by Tauri docs https://tauri.studio/docs/guides/command#async-commands
// TODO: Improve this, make less jank
#[tauri::command(async)]
async fn read_thread_loop(state: tauri::State<'_, AppState>) -> Result<(), String> {
    map_anyhow_str(state.read_thread_loop().await)?;
    Ok(())
}

#[tauri::command]
async fn connect(ip: String, port: u16, state: tauri::State<'_, AppState>) -> Result<(), String> {
    map_anyhow_str(state.inner().connect(ip, port).await)?;
    Ok(())
}

#[tauri::command]
async fn request_game_objects(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut packet_wrapper = PacketWrapper::new();
    packet_wrapper.Packet = Some(protos::qrue::PacketWrapper_oneof_Packet::searchObjects(
        SearchObjects::new(),
    ));

    map_anyhow_str(state.write_packet_and_flush(packet_wrapper).await)?;
    Ok(())
}

#[tauri::command]
async fn disconnect(state: tauri::State<'_, AppState>) -> Result<(), String> {
    // if let Some(stream) = &mut *state.tcp_stream.lock().expect("Unable to get lock tcp stream") {
    //     stream.shutdown().await.map_err(map_error)?;
    // }

    // *state.tcp_stream.lock().expect("Unable to get lock tcp stream") = None;

    map_anyhow_str(state.disconnect().await)?;

    Ok(())
}
