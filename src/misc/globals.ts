import { createStore } from "solid-js/store";
import { ProtoTypeInfo } from "../misc/proto/il2cpp";

export const [variables, setVariables] = createStore<{
    [addr: string]: [string, ProtoTypeInfo];
}>({});
