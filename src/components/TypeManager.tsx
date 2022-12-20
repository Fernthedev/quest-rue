import { MethodDataCell } from "./type_manager/members/MethodDataCell";
import { PropertyDataCell } from "./type_manager/members/PropertyDataCell";
import { FieldDataCell } from "./type_manager/members/FieldDataCell";
import { ProtoClassDetails, ProtoTypeInfo } from "../misc/proto/il2cpp";
import { Collapse, Divider, Loading } from "@nextui-org/react";
import {
    GetClassDetailsResult,
    GetGameObjectComponentsResult,
} from "../misc/proto/qrue";
import { PacketJSON, useRequestAndResponsePacket } from "../misc/events";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSnapshot } from "valtio";
import { gameObjectsStore } from "../misc/handlers/gameobject";
import Show from "./utils/Show";
import ComponentLegend from "./ComponentLegend";

function AllDetails(details: PacketJSON<ProtoClassDetails>) {
    const name = details?.clazz?.namespaze + " :: " + details?.clazz?.clazz;
    const key = `${details?.clazz?.namespaze}${details?.clazz?.clazz}${details?.clazz?.generics}`;

    const fields = useMemo(
        () =>
            details?.fields?.map((field) => (
                <FieldDataCell key={field.id} {...field} />
            )),
        [details.fields]
    );

    const props = useMemo(
        () =>
            details?.properties?.map((prop) => (
                <PropertyDataCell
                    key={`${prop.getterId}${prop.setterId}`}
                    {...prop}
                />
            )),
        [details.properties]
    );

    const methods = useMemo(
        () =>
            details?.methods
                ?.filter((method) =>
                    details.properties?.find(
                        (p) =>
                            p.getterId == method.id || p.setterId == method.id
                    ) === undefined
                )
                .map((method) => (
                    <MethodDataCell
                        key={`${method.id}${method.name}`}
                        {...method}
                    />

                    // <PropertyDataCell key={`${method.id}${method.name}`} {...method} />
                )),
        [details.methods, details.properties]
    );

    return (
        <div key={key}>
            <Collapse className="xs-collapse" title={name}>
                <div className="flex flex-row flex-wrap items-center gap-3 p-1">
                    <Show when={fields} keyed>
                        {(fields) => (
                            <>
                                {fields}
                                <Divider height={2} />
                            </>
                        )}
                    </Show>

                    <Show when={props} keyed>
                        {(props) => (
                            <>
                                {props}
                                <Divider height={2} />
                            </>
                        )}
                    </Show>

                    <Show when={methods} keyed>
                        {(methods) => (
                            <>
                                {methods}
                                <Divider height={2} />
                            </>
                        )}
                    </Show>
                </div>
            </Collapse>
        </div>
    );
}

function GetAllDetails(details?: PacketJSON<ProtoClassDetails>) {
    if (!details) return undefined;

    const id = (d: typeof details) =>
        `${d?.clazz?.namespaze}${d?.clazz?.clazz}${d?.clazz?.generics}`;

    const ret: JSX.Element[] = [<AllDetails key={id(details)} {...details} />];

    while (details?.parent) {
        details = details?.parent;
        ret.push(<AllDetails key={id(details)} {...details} />);
    }
    return ret;
}

const helpers: TypeHelper[] = [];

type TypeHelper = (
    details: PacketJSON<ProtoClassDetails>
) => JSX.Element | undefined;

export function RegisterHelper(helper: TypeHelper) {
    helpers.push(helper);
}

function GetHelpers(details?: PacketJSON<ProtoClassDetails>) {
    if (!details) return undefined;

    return helpers
        .map((helper) => helper(details))
        .filter((component) => component !== undefined);
}

export type TypeManagerParams = {
    gameObjectAddress?: string;
};

export function TypeManager() {
    const { objectsMap } = useSnapshot(gameObjectsStore);

    const params = useParams<TypeManagerParams>();
    // eslint-disable-next-line prefer-const
    let [classDetails, getClassDetails] =
        useRequestAndResponsePacket<GetClassDetailsResult>();

    if (!classDetails && import.meta.env.DEV)
        classDetails = {
            classDetails: {
                clazz: {
                    namespaze: "",
                    clazz: "SomeClass",
                },
                methods: [
                    {
                        name: "foo",
                        args: {
                            arg1: {
                                classInfo: {
                                    clazz: "SomeClass2",
                                    namespaze: "namespaze",
                                },
                            },
                            arg2: {
                                structInfo: {
                                    clazz: {
                                        clazz: "SomeStruct",
                                        namespaze: "",
                                    },
                                    fieldOffsets: [],
                                },
                            },
                            arg3: {
                                primitiveInfo: ProtoTypeInfo.Primitive.BOOLEAN,
                            },
                            arg4: {
                                primitiveInfo: ProtoTypeInfo.Primitive.INT,
                            },
                            arg5: {
                                primitiveInfo: ProtoTypeInfo.Primitive.STRING,
                            },
                        },
                        id: 5,
                        returnType: {
                            primitiveInfo: ProtoTypeInfo.Primitive.PTR,
                        },
                    },
                ],
            },
        };

    const [components, getComponents] =
        useRequestAndResponsePacket<GetGameObjectComponentsResult>();
    const selectedObject = useMemo(
        () =>
            params.gameObjectAddress && objectsMap
                ? objectsMap[parseInt(params.gameObjectAddress)][0]
                : undefined,
        [objectsMap, params.gameObjectAddress]
    );

    // get class details each time the info changes
    useEffect(() => {
        if (!selectedObject) return;

        console.log(`Got selected object ${selectedObject.address}`);

        getComponents({
            getGameObjectComponents: {
                address: selectedObject.address,
            },
        });
    }, [selectedObject]);

    const comp = components?.components && components.components[0];

    useEffect(() => {
        if (!comp) return;

        getClassDetails({
            getClassDetails: {
                classInfo: comp?.classInfo,
            },
        });
    }, [comp]);

    if (!classDetails?.classDetails) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <h3 className="text-center">
                    Requesting details for{" "}
                    {comp?.classInfo?.namespaze +
                        " :: " +
                        comp?.classInfo?.clazz}{" "}
                    at {params.gameObjectAddress}
                </h3>
                <Loading size="xl" />
            </div>
        );
    }

    console.log("ur mom", classDetails?.classDetails);

    return (
        <div
            className="flex flex-col"
            style={{ maxHeight: "100%", marginTop: "-1px" }}
        >
            <div className="flex justify-end float">
                <ComponentLegend />
            </div>
            {GetHelpers(classDetails?.classDetails)}
            {GetAllDetails(classDetails?.classDetails)}
        </div>
    );
}
