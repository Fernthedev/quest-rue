import { SetStoreFunction } from "solid-js/store";
import { ProtoClassDetails } from "../misc/proto/il2cpp";
import {
    Show,
    createSignal,
    createEffect,
    on,
    createMemo,
    For,
} from "solid-js";
import { useSettings } from "./Settings";
import { SpanFn, adaptiveSpanSize, separator } from "./ObjectView/ObjectView";
import { TypeSection } from "./ObjectView/TypeSection";
import styles from "./ObjectView/ObjectView.module.css";
import { Icon } from "solid-heroicons";
import { plus } from "solid-heroicons/solid";
import { useRequestAndResponsePacket } from "../misc/events";
import { GetClassDetailsResult } from "../misc/proto/qrue";
import { protoTypeToString, stringToProtoType } from "../misc/utils";
import toast from "solid-toast";

export function StaticsView(props: {
    statics: { [key: string]: ProtoClassDetails };
    setStatics: SetStoreFunction<{ [key: string]: ProtoClassDetails }>;
}) {
    const { columnCount } = useSettings();

    const emptyFallback = (
        <div class="w-full h-full flex-1">
            {separator()}
            <div class="relative w-full h-full">
                <div class="absolute-centered">No Static Classes Selected</div>
            </div>
        </div>
    );

    const [search, setSearch] = createSignal("");
    const [deferredColumnCount, setDeferredColumnCount] = createSignal(2);

    const [classInput, setClassInput] = createSignal("");
    const [newDetails, newDetailsLoading, requestNewDetails] =
        useRequestAndResponsePacket<GetClassDetailsResult>();

    function addClass() {
        if (classInput() in props.statics) return;

        const input = stringToProtoType(classInput());
        if (input.Info?.$case != "classInfo") {
            toast.error("Invalid class name");
            return;
        }

        requestNewDetails({
            $case: "getClassDetails",
            getClassDetails: {
                classInfo: input.Info.classInfo,
            },
        });
    }

    createEffect(() => {
        const result = newDetails();
        if (!result?.classDetails?.clazz) return;

        const name = protoTypeToString({
            Info: {
                $case: "classInfo",
                classInfo: result.classDetails.clazz,
            },
        });
        if (name in props.statics) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { parent, fields, properties, methods, ...smaller } =
            result.classDetails ?? {};
        props.setStatics(name, smaller);
    });

    let container: HTMLDivElement | undefined;
    createEffect(
        on(columnCount, () => {
            if (container) {
                const count = Number.parseInt(columnCount());
                container.style.setProperty(
                    "--type-grid-columns",
                    count.toString()
                );
                setDeferredColumnCount(count);
            }
        })
    );

    const spanFn = createMemo<SpanFn>(() => {
        const cols = deferredColumnCount();

        return (e: HTMLDivElement, colSize: number) =>
            adaptiveSpanSize(e, colSize, cols);
    });

    return (
        <div
            class={`p-4 w-full h-full flex flex-col overflow-x-hidden ${styles.viewContainer}`}
            ref={container}
        >
            <div class="flex gap-4 mb-1 items-end">
                <span class="text-xl flex-1 -mr-2">Static Class Members</span>
                <input
                    class="px-2"
                    placeholder="Search"
                    onInput={(e) => setSearch(e.target.value)}
                    value={search()}
                />
                <div class="whitespace-nowrap join">
                    <input
                        class="px-2 join-item"
                        placeholder="Add Class"
                        onInput={(e) => setClassInput(e.target.value.trim())}
                        value={classInput()}
                    />
                    <button class="p-2 join-item" onClick={addClass}>
                        <Show
                            when={newDetailsLoading()}
                            fallback={<Icon path={plus} class="w-6 h-6" />}
                        >
                            <img
                                src="/src/assets/loading.svg"
                                class="animate-spin"
                                elementtiming={"Loading"}
                                fetchpriority={"auto"}
                                alt="Loading"
                            />
                        </Show>
                    </button>
                </div>
            </div>
            <For each={Object.values(props.statics)} fallback={emptyFallback}>
                {(details) => (
                    <div>
                        {separator()}
                        <TypeSection
                            spanFn={spanFn()}
                            details={details}
                            selectedAddress={0n}
                            search={search()}
                            statics={true}
                            setStatics={props.setStatics}
                        />
                    </div>
                )}
            </For>
        </div>
    );
}
