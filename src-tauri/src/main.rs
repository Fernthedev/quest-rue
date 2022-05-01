#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
#![feature(mutex_unlock)]
#![feature(iterator_try_collect)]


use appstate::AppState;
use bytes::{BytesMut};
use protobuf::Message;
use protos::qrue::{PacketWrapper, SearchObjects};
use serde_json::Value;
use tauri::{async_runtime, AppHandle, Manager};

mod appstate;
mod protos;

#[derive(Clone, serde::Serialize)]
struct PacketReceivePayload {
    packet_type: String,
    general_packet_data: Option<Value>,
}

const PACKET_LISTEN_EVENT: &str = "protobuf-receive";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            request_game_objects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

// ugh, Tauri doesn't like Future<std::result::Result<(), anyhow::Error>> because anyhow::Error doesn't implement Serialize/Deserialize
#[inline]
// I hate this I hate this I hate this
fn map_anyhow_str<T>(r: Result<T, anyhow::Error>) -> Result<T, String> {
    match r {
        Ok(o) => Ok(o),
        Err(e) => Err(e.to_string()),
    }
}

fn handle_packet(bytes_mut: BytesMut, app_handle: &AppHandle) {
    let packet = match PacketWrapper::parse_from_carllerche_bytes(&bytes_mut.into()) {
        Ok(packet) => packet,
        Err(e) => panic!("Unable to parse bytes {}", dbg!(e)),
    };

    if packet.Packet.is_none() {
        panic!("Packet is null {:?}", dbg!(packet));
    }

    let payload = PacketReceivePayload {
        packet_type: format!("{:?}", packet.Packet.unwrap()),
        general_packet_data: None,
    };

    // TODO: Add packet data in event
    app_handle
        .emit_all(PACKET_LISTEN_EVENT, payload)
        .expect("Unable to emit event");
}

#[tauri::command]
async fn connect(
    ip: String,
    port: u16,
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    map_anyhow_str(state.inner().connect(ip, port).await)?;
    async_runtime::spawn(async move {
        if let Err(e) = app_handle
            .state::<AppState>()
            .read_thread_loop(|bytes| handle_packet(bytes, &app_handle))
            .await
        {
            dbg!(e);
        }
    });
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
