import { handleGameObjects } from "./handlers/gameobject";

export async function setupDev() {
    if (import.meta.env.VITE_USE_QUEST_MOCK != "true") return;

    console.log("Setting up dev")
    const main_menu_json = (await import("../misc/test_data_in_main_menu.json"))
        .items;
    // const song_select = (await import("../misc/test_data_in_song_select.json")).items

    handleGameObjects({
        objects: main_menu_json,
    });
}
