import { invoke } from "@tauri-apps/api/tauri";

export function connect(ip: string, port: number) {
    return invoke<void>('connect', { ip: ip, port: port });
}

export function isConnected() {
    return invoke<boolean>('is_connected');
}

export function requestGameObjects() {
    return invoke<void>("request_game_objects")
}