#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // env_logger::builder().filter_level(LevelFilter::Trace).init();

    tauri::Builder::default()
        // .manage(AppState::default())
        // .invoke_handler(tauri::generate_handler![
        //     connect,
        //     disconnect,
        //     request_game_objects,
        //     is_connected
        // ])
        .plugin(tauri_plugin_websocket::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
