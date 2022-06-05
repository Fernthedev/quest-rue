#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
#![feature(mutex_unlock)]
#![feature(iterator_try_collect)]

use appstate::AppState;
use bytes::BytesMut;
use log::{debug, LevelFilter};
use protobuf::Message;
use protos::qrue::{PacketWrapper, SearchObjects};
use serde_json::Value;
use tauri::{async_runtime, AppHandle, Manager};

mod appstate;
mod events;
mod protos;

#[derive(Clone, serde::Serialize)]
struct PacketReceivePayload {
    packet_type: String,
    general_packet_data: Option<Value>,
}

const PACKET_LISTEN_EVENT: &str = "protobuf-receive";
const CONNECTED_EVENT: &str = "connected-to-quest";
const READ_LOOP_DIED: &str = "read-loop-died-disconnected";
const FRONTEND_DISCONNECTED_EVENT: &str = "frontend-disconnected-to-quest";
const FAILURE_DISCONNECTED_EVENT: &str = "failure-disconnected-to-quest";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::builder().filter_level(LevelFilter::Trace).init();

    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            request_game_objects,
            is_connected
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
        Err(e) => {
            debug!("{:?}", &e);
            Err(format!("{:?}", &e))
        },
    }
}

fn handle_packet(bytes_mut: BytesMut, app_handle: &AppHandle) {
    let packet = match PacketWrapper::parse_from_carllerche_bytes(&bytes_mut.into()) {
        Ok(packet) => packet,
        Err(e) => {
            debug!("{}", &e);
            panic!("Unable to parse bytes {}", e)
        },
    };

    if packet.Packet.is_none() {
        panic!("Packet is null {:?}", dbg!(packet));
    }

    let packet_enum = &packet.Packet;

    let payload = PacketReceivePayload {
        packet_type: format!("{:?}", packet_enum.as_ref().unwrap()),
        general_packet_data: None,
    };

    // Invoke packet specific events with their respective data
    if let Some((event_name, serde_value)) =
        events::handle_specific_events(packet_enum.as_ref().unwrap())
    {
        let specific_payload = PacketReceivePayload {
            packet_type: format!("{:?}", packet_enum.as_ref().unwrap()),
            general_packet_data: Some(serde_value),
        };
        debug!("Invoking event {}", event_name);
        // TODO: Prefix event
        app_handle
            .emit_all(event_name, specific_payload)
            .expect("Unable to emit event");
    }

    // Generic packet event
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

    app_handle
        .emit_all(CONNECTED_EVENT, ())
        .expect("Unable to emit event");

    async_runtime::spawn(async move {
        debug!("Reading loop started!");
        if let Err(e) = app_handle
            .state::<AppState>()
            .read_thread_loop(|bytes| handle_packet(bytes, &app_handle))
            .await
        {
            app_handle
                .emit_all(READ_LOOP_DIED, ())
                .expect("Unable to emit event");
            debug!("{}", e);
        }
    });
    Ok(())
}

#[tauri::command]
async fn request_game_objects(
    app_handle: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut packet_wrapper = PacketWrapper::new();
    packet_wrapper.set_searchObjects(SearchObjects::new());

    debug!("Requesting objects!");

    // println!("Receiving object request, responding");
    // // TODO: Remove
    // let objects = [
    //     "GameCore",
    //     "Something",
    //     "Plant",
    //     "Really long name",
    //     "Gaming",
    //     "Mom",
    //     "Moo",
    //     "Cow",
    //     "Beep",
    //     "Beep",
    //     "Boat dog",
    //     "fern",
    // ];
    // app_handle.emit_all(
    //     "GAMEOBJECTS_LIST_EVENT",
    //     PacketReceivePayload {
    //         packet_type: "GAMEOBJECTS_LIST_EVENT".to_string(),
    //         general_packet_data: Some(serde_json::to_value(objects).unwrap()),
    //     },
    // ).unwrap();

    map_anyhow_str(write_packet(&app_handle, &state, packet_wrapper).await)?;
    Ok(())
}

#[tauri::command]
async fn disconnect(
    state: tauri::State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    // if let Some(stream) = &mut *state.tcp_stream.lock().expect("Unable to get lock tcp stream") {
    //     stream.shutdown().await.map_err(map_error)?;
    // }

    // *state.tcp_stream.lock().expect("Unable to get lock tcp stream") = None;

    map_anyhow_str(state.disconnect().await)?;

    app_handle
        .emit_all(FRONTEND_DISCONNECTED_EVENT, ())
        .expect("Unable to emit event");

    Ok(())
}

#[tauri::command]
async fn is_connected(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.is_connected().await)
}

pub async fn write_packet(
    app_handle: &AppHandle,
    state: &tauri::State<'_, AppState>,
    packet_wrapper: PacketWrapper,
) -> anyhow::Result<()> {
    let result = state.write_packet_and_flush(packet_wrapper).await;

    if let Err(e) = &result {
        app_handle
            .emit_all(
                FAILURE_DISCONNECTED_EVENT,
                format!("Unable to write: {:?}", &e),
            )
            .expect("Unable to emit event");

        state.disconnect().await?;
    }

    result
}
