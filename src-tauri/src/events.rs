use log::debug;
use serde_json::Value;

use crate::protos::qrue::{PacketWrapper_oneof_Packet, FindGameObjectsResult};

const GAME_OBJECT_LIST_RESULT: &str = "GAMEOBJECTS_LIST_EVENT";

type EventReturnType = (&'static str, Value);

pub fn handle_specific_events(
    packet_wrapper: &PacketWrapper_oneof_Packet,
) -> Option<EventReturnType> {
    match packet_wrapper {
        PacketWrapper_oneof_Packet::invokeMethodResult(_) => todo!(),
        PacketWrapper_oneof_Packet::findGameObjectResult(packet) => {
            Some(handle_gameobjects_result(packet))
        }

        PacketWrapper_oneof_Packet::loadObjectResult(_) => todo!(),
        _ => None,
    }
}

pub fn handle_gameobjects_result(packet: &FindGameObjectsResult) -> EventReturnType {
    debug!("Packet for game objects: {:?}", &packet.get_foundObjects());

    (
        GAME_OBJECT_LIST_RESULT,
        // TODO: Is vec necessary? or is splice better?
        serde_json::to_value(packet.get_foundObjects()).expect("Value serialization failed"),
    )
}
