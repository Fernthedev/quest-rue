use serde_json::Value;

use crate::protos::qrue::{PacketWrapper_oneof_Packet, SearchObjectsResult};

const GAME_OBJECT_LIST_RESULT: &str = "GAMEOBJECTS_LIST_EVENT";

type EventReturnType = (&'static str, Value);

pub fn handle_specific_events(
    packet_wrapper: &PacketWrapper_oneof_Packet,
) -> Option<EventReturnType> {
    match packet_wrapper {
        PacketWrapper_oneof_Packet::invokeMethodResult(_) => todo!(),
        PacketWrapper_oneof_Packet::searchObjectsResult(packet) => {
            Some(handle_gameobjects_result(packet))
        }

        PacketWrapper_oneof_Packet::loadObjectResult(_) => todo!(),
        _ => None,
    }
}

pub fn handle_gameobjects_result(packet: &SearchObjectsResult) -> EventReturnType {
    (
        GAME_OBJECT_LIST_RESULT,
        // TODO: Is vec necessary? or is splice better?
        serde_json::to_value::<Vec<String>>(packet.foundObjects.to_vec().into_iter().map(|f| f.name).collect()).expect("Value serialization failed"),
    )
}
