import { ProtoTypeInfo_Primitive } from "./proto/il2cpp";
import { PacketWrapper } from "./proto/qrue";
import { stringToProtoData } from "./utils";

export function devPacketResponse(p: PacketWrapper, callback: (response: PacketWrapper) => void) {
    switch (p.Packet?.$case) {
        case "getAllGameObjects":
            console.log("mock get game objects response");
            import("../misc/test_data_in_main_menu.json").then(main_menu_json => {
                const items = main_menu_json.items;
                callback({
                    queryResultId: p.queryResultId,
                    Packet: {
                        $case: "getAllGameObjectsResult",
                        getAllGameObjectsResult: {
                            objects: items
                        }
                    }
                });
            });
            break;
        case "getInstanceDetails":
            console.log("mock get instance details response");
            import("../misc/test_game_object_class_details.json").then(class_details => {
                callback({
                    queryResultId: p.queryResultId,
                    Packet: {
                        $case: "getInstanceDetailsResult",
                        getInstanceDetailsResult: class_details
                    }
                });
            });
            break;
        case "getClassDetails":
            console.log("mock get class details response");
            import("../misc/test_game_object_class_details.json").then(class_details => {
                callback({
                    queryResultId: p.queryResultId,
                    Packet: {
                        $case: "getClassDetailsResult",
                        getClassDetailsResult: class_details
                    }
                });
            });
            break;
    }
}
