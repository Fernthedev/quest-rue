import { createStore } from "solid-js/store";
import { ProtoClassDetails } from "../misc/proto/il2cpp";

export const [variables, setVariables] = createStore<{
  [addr: string]: {
    name: string;
    type: ProtoClassDetails;
  };
}>({});
